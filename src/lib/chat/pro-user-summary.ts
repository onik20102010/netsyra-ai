// Pro User Summary System
// Enhanced summary system for Pro plan users with more detailed analysis
// Maintains comprehensive user behavior patterns across all chats

import { createServerSupabaseClient } from "@/lib/supabase/server";

interface ProUserSummary {
  id: string;
  user_id: string;
  summary: string;
  detailed_profile: any;
  interaction_patterns: any;
  project_context: any;
  last_updated_at: string;
  message_count_at_update: number;
}

const PRO_USER_SUMMARY_PROMPT = `You are a premium personal memory system for Pro users, similar to ChatGPT's memory but more detailed and professional. Your job is to build a rich, nuanced understanding of the user across all their conversations.

## What to capture (in order of priority):

### 1. Professional Identity
- Their role, industry, and expertise level
- Technical stack and tools they use regularly
- Their work context (startup, enterprise, freelance, student)
- Career stage and aspirations

### 2. Active Projects & Goals
- What they're currently building or working on
- Specific project requirements and constraints
- Their long-term professional objectives
- Deadlines or milestones they've mentioned

### 3. Technical Preferences
- Preferred languages, frameworks, and tools
- Architectural patterns they favor
- Development methodologies they follow
- Tools they've expressed frustration with

### 4. Communication & Learning Style
- How they prefer information presented (concise vs detailed, code-first vs explanation-first)
- Their preferred response format (bullet points, paragraphs, code blocks)
- How they learn best (examples, documentation, hands-on)
- Their patience level for detailed explanations

### 5. Behavioral Patterns
- Common types of questions they ask
- Times of day they're most active
- How they approach problem-solving
- Their decision-making style

## Writing style:
- Write in natural, flowing prose like a colleague's notes about a coworker
- Be specific: "Uses Next.js 14 with App Router and prefers Server Components" not "Likes React"
- Include concrete details when available
- Structure with clear sections but keep the writing natural
- Prioritize actionable insights that directly improve response quality

## Update strategy:
- **Add**: New professional details, project updates, preference changes
- **Keep**: Core identity and long-term patterns that remain accurate
- **Refine**: Update when new information provides better context
- **Drop**: Temporary interests, one-off questions, outdated project details
- **Merge**: Combine related observations into richer profiles

## Hard rules:
- Maximum 1000 characters including spaces and punctuation
- Never duplicate profile information (name, goal, custom instructions)
- Focus on professional context and actionable insights
- When at capacity, prioritize professional identity and active projects`;

export async function getProUserSummary(userId: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pro_user_summaries")
    .select("summary")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.summary;
}

export async function generateProUserSummary(
  userId: string,
  conversationHistory: Array<{ role: string; content: string }>,
  totalMessageCount: number
): Promise<void> {
  // Generate after every 10 messages for Pro users (less frequent, more comprehensive)
  if (totalMessageCount % 10 !== 0) return;

  const supabase = await createServerSupabaseClient();
  
  // Get existing summary
  const { data: existing } = await supabase
    .from("pro_user_summaries")
    .select("summary, detailed_profile, interaction_patterns, project_context")
    .eq("user_id", userId)
    .single();

  const existingSummary = existing?.summary || "No existing summary.";
  const detailedProfile = existing?.detailed_profile || {};
  const interactionPatterns = existing?.interaction_patterns || {};
  const projectContext = existing?.project_context || {};

  // Get user profile to avoid duplication
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, goal, custom_instructions")
    .eq("user_id", userId)
    .single();

  const profileInfo = profile ? `
USER PROFILE (already stored separately - DO NOT duplicate this):
- Name: ${profile.name || "N/A"}
- Goal: ${profile.goal || "N/A"}
- Custom Instructions: ${profile.custom_instructions || "N/A"}
` : "";

  // Build context for summary generation
  const summaryContext = `
EXISTING SUMMARY:
${existingSummary}

EXISTING DETAILED PROFILE:
${JSON.stringify(detailedProfile, null, 2)}

EXISTING INTERACTION PATTERNS:
${JSON.stringify(interactionPatterns, null, 2)}

EXISTING PROJECT CONTEXT:
${JSON.stringify(projectContext, null, 2)}

${profileInfo}
RECENT CONVERSATION HISTORY (last 20 messages):
${conversationHistory.slice(-20).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

TASK: Update the existing summary by incorporating new insights from the recent conversation.
Remove outdated information. Keep the summary under 1000 characters including spaces and punctuation.
Focus on professional context, technical details, and actionable insights. Maintain the structured format.
IMPORTANT: Do NOT duplicate information already in the user profile.
`;

  try {
    // Use Groq API key 4 for summary generation
    const apiKey = process.env.GROQ_API_KEY_4;
    if (!apiKey) {
      console.error("GROQ_API_KEY_4 is not configured");
      return;
    }

    // Use a more capable model for Pro users
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // More capable model for Pro users
        messages: [
          { role: "system", content: PRO_USER_SUMMARY_PROMPT },
          { role: "user", content: summaryContext },
        ],
        temperature: 0.3,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      console.error("Failed to generate pro user summary:", response.statusText);
      return;
    }

    const data = await response.json();
    const newSummary = data.choices?.[0]?.message?.content?.trim();

    if (!newSummary) {
      console.error("Empty summary generated");
      return;
    }

    // Ensure summary is under 1000 characters
    const truncatedSummary = newSummary.length > 1000 ? newSummary.slice(0, 1000) : newSummary;

    // Analyze conversation for enhanced profile data
    const newDetailedProfile = analyzeDetailedProfile(conversationHistory.slice(-20));
    const newInteractionPatterns = analyzeInteractionPatterns(conversationHistory.slice(-20), interactionPatterns);
    const newProjectContext = analyzeProjectContext(conversationHistory.slice(-20), projectContext);

    // Upsert the summary
    await supabase
      .from("pro_user_summaries")
      .upsert(
        {
          user_id: userId,
          summary: truncatedSummary,
          detailed_profile: newDetailedProfile,
          interaction_patterns: newInteractionPatterns,
          project_context: newProjectContext,
          last_updated_at: new Date().toISOString(),
          message_count_at_update: totalMessageCount,
        },
        { onConflict: "user_id" }
      );

    console.log("Pro user summary updated for user:", userId);
  } catch (error) {
    console.error("Error generating pro user summary:", error);
  }
}

function analyzeDetailedProfile(messages: Array<{ role: string; content: string }>): any {
  // Analyze messages for professional details, expertise, etc.
  const profile: any = {};
  
  messages.forEach(msg => {
    if (msg.role === 'user') {
      const content = msg.content.toLowerCase();
      
      // Detect technical mentions
      if (content.includes('javascript') || content.includes('js')) profile.javascript = (profile.javascript || 0) + 1;
      if (content.includes('python')) profile.python = (profile.python || 0) + 1;
      if (content.includes('react')) profile.react = (profile.react || 0) + 1;
      if (content.includes('node')) profile.node = (profile.node || 0) + 1;
      if (content.includes('database') || content.includes('sql')) profile.database = (profile.database || 0) + 1;
      
      // Detect expertise level
      if (content.includes('beginner') || content.includes('learning')) profile.expertise_level = 'beginner';
      if (content.includes('experienced') || content.includes('senior')) profile.expertise_level = 'experienced';
    }
  });
  
  return profile;
}

function analyzeInteractionPatterns(messages: Array<{ role: string; content: string }>, existing: any): any {
  const patterns = { ...existing };
  
  messages.forEach(msg => {
    if (msg.role === 'user') {
      const content = msg.content.toLowerCase();
      
      // Detect question types
      if (content.includes('how')) patterns.how_questions = (patterns.how_questions || 0) + 1;
      if (content.includes('why')) patterns.why_questions = (patterns.why_questions || 0) + 1;
      if (content.includes('what')) patterns.what_questions = (patterns.what_questions || 0) + 1;
      if (content.includes('debug') || content.includes('error') || content.includes('fix')) patterns.debugging = (patterns.debugging || 0) + 1;
      if (content.includes('best practice') || content.includes('optimize')) patterns.optimization = (patterns.optimization || 0) + 1;
    }
  });
  
  return patterns;
}

function analyzeProjectContext(messages: Array<{ role: string; content: string }>, existing: any): any {
  const context = { ...existing };
  
  messages.forEach(msg => {
    if (msg.role === 'user') {
      const content = msg.content.toLowerCase();
      
      // Detect project mentions
      if (content.includes('project') || content.includes('app') || content.includes('website')) {
        const projectKeywords = content.match(/(?:project|app|website)\s+(?:is|called|named)\s+(\w+)/i);
        if (projectKeywords) {
          context.current_project = projectKeywords[1];
        }
      }
      
      // Detect project phases
      if (content.includes('building') || content.includes('developing')) context.phase = 'development';
      if (content.includes('testing') || content.includes('debugging')) context.phase = 'testing';
      if (content.includes('deploying') || content.includes('deployment')) context.phase = 'deployment';
    }
  });
  
  return context;
}

export async function shouldUseProUserSummary(userMessage: string): Promise<boolean> {
  const lowerMessage = userMessage.toLowerCase();
  
  // Personal context triggers
  const personalTriggers = [
    'remember', 'before', 'earlier', 'previously', 'past', 'mentioned',
    'told you', 'said', 'discussed', 'talked about', 'my', 'i am',
    'i like', 'i want', 'i need', 'working on', 'project', 'expert',
    'experience', 'prefer', 'usually', 'typically', 'my approach',
    'my stack', 'my setup', 'my workflow', 'my team', 'my company',
    'what do you know about me', 'recall', 'remind me'
  ];
  
  // Professional context triggers
  const professionalTriggers = [
    'recommend', 'suggest', 'advice', 'best for me', 'based on my',
    'given my', 'considering my', 'for my use case', 'for my project',
    'in my situation', 'with my experience', 'at my level'
  ];
  
  const allTriggers = [...personalTriggers, ...professionalTriggers];
  return allTriggers.some(keyword => lowerMessage.includes(keyword));
}
