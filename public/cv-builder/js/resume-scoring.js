/* ==================================================
   Resume Content Scoring
   Analyzes CV data quality and provides actionable
   feedback with a score out of 100.
   ================================================== */

const ResumeScore = (function () {
  let active = false;

  function open(cvData) {
    active = true;
    render(cvData);
    setTimeout(() => analyze(cvData), 100);
  }

  function close() {
    active = false;
    const appMain = document.getElementById("appMain");
    appMain.classList.remove("editor-mode");
    showPreview();
  }

  function render(cvData) {
    const appMain = document.getElementById("appMain");
    appMain.classList.add("editor-mode");

    appMain.innerHTML = `
      <div class="score-layout">
        <div class="score-header">
          <div class="score-header-left">
            <h2><i class="fas fa-chart-line"></i> Resume Score</h2>
            <p class="score-subtitle">Real-time content quality analysis with actionable feedback.</p>
          </div>
          <button class="btn btn-ghost" onclick="ResumeScore.close()" title="Close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="score-body" id="scoreBody">
          <div class="score-loading">
            <i class="fas fa-chart-line fa-pulse"></i>
            <p>Analyzing your CV content...</p>
          </div>
        </div>

        <div class="score-footer">
          <button class="btn btn-secondary" onclick="ResumeScore.close()">
            <i class="fas fa-arrow-left"></i> Back to Preview
          </button>
          <button class="btn btn-primary" onclick="ResumeScore.reanalyze()">
            <i class="fas fa-refresh"></i> Re-analyze
          </button>
        </div>
      </div>
    `;
  }

  function reanalyze() {
    const body = document.getElementById("scoreBody");
    if (body) {
      body.innerHTML = `
        <div class="score-loading">
          <i class="fas fa-chart-line fa-pulse"></i>
          <p>Analyzing your CV content...</p>
        </div>
      `;
    }
    setTimeout(() => analyze(cvData), 100);
  }

  function analyze(data) {
    const checks = [];
    let totalScore = 0;
    let maxScore = 0;

    // 1. Personal Info Completeness
    const p = data.personal || {};
    const personalFields = ["fullName", "professionalTitle", "email", "phone", "location"];
    const personalFilled = personalFields.filter(f => p[f] && p[f].trim()).length;
    const personalScore = Math.round((personalFilled / personalFields.length) * 100);
    checks.push({
      category: "Personal Information",
      icon: "fa-user",
      score: personalScore,
      maxScore: 100,
      weight: 10,
      details: personalFilled < personalFields.length
        ? `Missing: ${personalFields.filter(f => !p[f] || !p[f].trim()).map(f => f.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())).join(", ")}`
        : "All essential personal fields are filled.",
      status: personalScore >= 80 ? "good" : personalScore >= 50 ? "warning" : "bad"
    });

    // 2. Professional Summary
    const s = data.summary || {};
    const summaryText = s.text || "";
    let summaryScore = 0;
    if (summaryText) {
      summaryScore += 40;
      if (summaryText.length >= 100) summaryScore += 30;
      if (summaryText.length >= 200) summaryScore += 15;
      if (summaryText.length <= 500) summaryScore += 15;
      // Check for buzzwords
      const buzzwords = ["passionate", "results-driven", "team player", "hard-working", "go-getter", "think outside the box"];
      const foundBuzz = buzzwords.filter(b => summaryText.toLowerCase().includes(b));
      if (foundBuzz.length > 0) summaryScore -= 20;
    }
    summaryScore = Math.max(0, Math.min(100, summaryScore));
    checks.push({
      category: "Professional Summary",
      icon: "fa-feather",
      score: summaryScore,
      maxScore: 100,
      weight: 10,
      details: !summaryText
        ? "No summary added. Write 2-3 sentences about your professional background."
        : summaryText.length < 100
          ? "Summary is too short. Aim for 100-300 characters."
          : summaryText.length > 500
            ? "Summary is too long. Keep it under 500 characters."
            : "Good summary length and content.",
      status: summaryScore >= 70 ? "good" : summaryScore >= 40 ? "warning" : "bad"
    });

    // 3. Work Experience
    const exp = data.experience || [];
    let expScore = 0;
    if (exp.length > 0) {
      expScore += 30;
      if (exp.length >= 2) expScore += 20;
      if (exp.length >= 3) expScore += 10;
      // Check descriptions
      const withDesc = exp.filter(e => e.description && e.description.trim()).length;
      expScore += Math.round((withDesc / exp.length) * 20);
      // Check achievements
      const withAch = exp.filter(e => e.achievements && e.achievements.trim()).length;
      expScore += Math.round((withAch / exp.length) * 20);
    }
    expScore = Math.max(0, Math.min(100, expScore));
    checks.push({
      category: "Work Experience",
      icon: "fa-briefcase",
      score: expScore,
      maxScore: 100,
      weight: 20,
      details: exp.length === 0
        ? "No work experience added. Add at least one position."
        : exp.length < 2
          ? "Only one experience entry. Add more to show career growth."
          : `${exp.length} entries. ${exp.filter(e => e.description && e.description.trim()).length} have descriptions, ${exp.filter(e => e.achievements && e.achievements.trim()).length} have achievements.`,
      status: expScore >= 70 ? "good" : expScore >= 40 ? "warning" : "bad"
    });

    // 4. Education
    const edu = data.education || [];
    let eduScore = 0;
    if (edu.length > 0) {
      eduScore += 50;
      if (edu.length >= 2) eduScore += 25;
      const withDegree = edu.filter(e => e.degree && e.degree.trim()).length;
      eduScore += Math.round((withDegree / edu.length) * 25);
    }
    eduScore = Math.max(0, Math.min(100, eduScore));
    checks.push({
      category: "Education",
      icon: "fa-graduation-cap",
      score: eduScore,
      maxScore: 100,
      weight: 10,
      details: edu.length === 0
        ? "No education entries added."
        : `${edu.length} education entries recorded.`,
      status: eduScore >= 70 ? "good" : eduScore >= 40 ? "warning" : "bad"
    });

    // 5. Skills
    const skills = data.skills || [];
    let skillScore = 0;
    if (skills.length > 0) {
      skillScore += 30;
      if (skills.length >= 5) skillScore += 30;
      if (skills.length >= 10) skillScore += 20;
      if (skills.length >= 15) skillScore += 20;
    }
    skillScore = Math.max(0, Math.min(100, skillScore));
    checks.push({
      category: "Skills",
      icon: "fa-tools",
      score: skillScore,
      maxScore: 100,
      weight: 10,
      details: skills.length === 0
        ? "No skills added. Add at least 5-10 relevant skills."
        : skills.length < 5
          ? `Only ${skills.length} skills. Aim for at least 5-10.`
          : `${skills.length} skills listed.`,
      status: skillScore >= 70 ? "good" : skillScore >= 40 ? "warning" : "bad"
    });

    // 6. Projects
    const projects = data.projects || [];
    let projScore = 0;
    if (projects.length > 0) {
      projScore += 50;
      if (projects.length >= 2) projScore += 25;
      const withDesc = projects.filter(pr => pr.description && pr.description.trim()).length;
      projScore += Math.round((withDesc / projects.length) * 25);
    }
    projScore = Math.max(0, Math.min(100, projScore));
    checks.push({
      category: "Projects",
      icon: "fa-folder-open",
      score: projScore,
      maxScore: 100,
      weight: 8,
      details: projects.length === 0
        ? "No projects added. Adding projects strengthens your CV."
        : `${projects.length} projects listed.`,
      status: projScore >= 70 ? "good" : projScore >= 40 ? "warning" : "bad"
    });

    // 7. Certifications
    const certs = data.certifications || [];
    let certScore = 0;
    if (certs.length > 0) {
      certScore += 60;
      if (certs.length >= 2) certScore += 40;
    }
    certScore = Math.max(0, Math.min(100, certScore));
    checks.push({
      category: "Certifications",
      icon: "fa-certificate",
      score: certScore,
      maxScore: 100,
      weight: 5,
      details: certs.length === 0
        ? "No certifications added. Optional but adds credibility."
        : `${certs.length} certifications listed.`,
      status: certScore >= 70 ? "good" : certScore >= 40 ? "warning" : "bad"
    });

    // 8. Languages
    const langs = data.languages || [];
    let langScore = 0;
    if (langs.length > 0) {
      langScore += 50;
      if (langs.length >= 2) langScore += 30;
      if (langs.length >= 3) langScore += 20;
    }
    langScore = Math.max(0, Math.min(100, langScore));
    checks.push({
      category: "Languages",
      icon: "fa-language",
      score: langScore,
      maxScore: 100,
      weight: 5,
      details: langs.length === 0
        ? "No languages added. Even one language is good to list."
        : `${langs.length} languages listed.`,
      status: langScore >= 70 ? "good" : langScore >= 40 ? "warning" : "bad"
    });

    // 9. Action Verbs in Descriptions
    const actionVerbs = ["led", "built", "created", "developed", "managed", "designed", "implemented", "launched", "improved", "increased", "reduced", "optimized", "established", "coordinated", "analyzed", "delivered", "achieved", "spearheaded", "orchestrated", "streamlined"];
    const allDescriptions = [
      ...(data.experience || []).flatMap(e => [e.description || "", e.achievements || ""]),
      ...(data.projects || []).map(p => p.description || ""),
      ...(data.volunteer || []).map(v => v.description || ""),
    ].join(" ").toLowerCase();
    const verbCount = actionVerbs.filter(v => allDescriptions.includes(v)).length;
    let verbScore = Math.min(100, verbCount * 15);
    checks.push({
      category: "Action Verbs",
      icon: "fa-bolt",
      score: verbScore,
      maxScore: 100,
      weight: 7,
      details: verbCount === 0
        ? "No action verbs found in descriptions. Use words like: led, built, developed, improved."
        : `${verbCount} action verbs detected. ${verbCount < 5 ? "Try to use more." : "Great use of action language."}`,
      status: verbScore >= 70 ? "good" : verbScore >= 40 ? "warning" : "bad"
    });

    // 10. Quantified Achievements
    const quantRegex = /\d+%|\$[\d,]+|\d+,\d+|\d+\s*(people|users|clients|projects|reports|hours|weeks|months|years)/gi;
    const quantMatches = allDescriptions.match(quantRegex) || [];
    let quantScore = Math.min(100, quantMatches.length * 25);
    checks.push({
      category: "Quantified Results",
      icon: "fa-chart-bar",
      score: quantScore,
      maxScore: 100,
      weight: 5,
      details: quantMatches.length === 0
        ? "No quantified results found. Add numbers like 'increased sales by 20%' or 'managed 15 team members'."
        : `${quantMatches.length} quantified achievements found. ${quantMatches.length < 3 ? "Add more numbers." : "Excellent use of metrics."}`,
      status: quantScore >= 70 ? "good" : quantScore >= 40 ? "warning" : "bad"
    });

    // 11. Contact Links
    const links = [p.linkedin, p.website, p.github].filter(Boolean);
    let linkScore = 0;
    if (links.length > 0) linkScore += 40;
    if (links.length >= 2) linkScore += 30;
    if (links.length >= 3) linkScore += 30;
    checks.push({
      category: "Online Presence",
      icon: "fa-link",
      score: linkScore,
      maxScore: 100,
      weight: 5,
      details: links.length === 0
        ? "No online links added (LinkedIn, GitHub, website)."
        : `${links.length} online links provided.`,
      status: linkScore >= 70 ? "good" : linkScore >= 40 ? "warning" : "bad"
    });

    // 12. Overall Completeness
    const sections = ["experience", "education", "skills", "projects", "certifications", "languages", "awards", "volunteer", "interests", "references"];
    const filledSections = sections.filter(sec => data[sec] && data[sec].length > 0).length;
    let completenessScore = Math.round((filledSections / sections.length) * 100);
    checks.push({
      category: "Section Completeness",
      icon: "fa-list-check",
      score: completenessScore,
      maxScore: 100,
      weight: 5,
      details: `${filledSections}/${sections.length} sections filled. ${filledSections < 5 ? "Fill more sections to strengthen your CV." : "Good coverage across sections."}`,
      status: completenessScore >= 70 ? "good" : completenessScore >= 40 ? "warning" : "bad"
    });

    // 13. ATS Keywords (Applicant Tracking System)
    const atsKeywords = ["managed", "developed", "implemented", "analyzed", "designed", "coordinated", "supervised", "trained", "resolved", "optimized", "automated", "collaborated", "negotiated", "presented", "researched", "budget", "revenue", "strategy", "compliance", "stakeholder"];
    const atsFound = atsKeywords.filter(k => allDescriptions.includes(k)).length;
    let atsScore = Math.min(100, atsFound * 10);
    checks.push({
      category: "ATS Keywords",
      icon: "fa-robot",
      score: atsScore,
      maxScore: 100,
      weight: 8,
      details: atsFound === 0
        ? "No ATS-friendly keywords found. Add terms like: managed, developed, implemented, optimized."
        : `${atsFound} ATS keywords detected. ${atsFound < 5 ? "Add more recruiter-friendly terms." : "Strong ATS optimization."}`,
      status: atsScore >= 70 ? "good" : atsScore >= 40 ? "warning" : "bad"
    });

    // 14. Readability Score
    const wordCount = allDescriptions.split(/\s+/).filter(Boolean).length;
    const sentenceCount = (allDescriptions.match(/[.!?]+/g) || []).length || 1;
    const avgWordsPerSentence = wordCount / sentenceCount;
    let readabilityScore = 100;
    if (avgWordsPerSentence > 30) readabilityScore -= 40;
    else if (avgWordsPerSentence > 25) readabilityScore -= 20;
    if (avgWordsPerSentence < 5 && wordCount > 0) readabilityScore -= 30;
    readabilityScore = Math.max(0, Math.min(100, readabilityScore));
    checks.push({
      category: "Readability",
      icon: "fa-book-open",
      score: readabilityScore,
      maxScore: 100,
      weight: 5,
      details: wordCount === 0
        ? "No description text to analyze."
        : `~${Math.round(avgWordsPerSentence)} words per sentence. ${avgWordsPerSentence > 25 ? "Sentences are too long. Break them up." : avgWordsPerSentence < 5 ? "Sentences are too short. Add more detail." : "Good sentence length."}`,
      status: readabilityScore >= 70 ? "good" : readabilityScore >= 40 ? "warning" : "bad"
    });

    // 15. Bullet Points Usage
    const bulletCount = (allDescriptions.match(/[•·\-*]/g) || []).length;
    let bulletScore = 0;
    if (bulletCount >= 10) bulletScore = 100;
    else if (bulletCount >= 5) bulletScore = 70;
    else if (bulletCount >= 2) bulletScore = 40;
    else bulletScore = 10;
    checks.push({
      category: "Bullet Points",
      icon: "fa-list-ul",
      score: bulletScore,
      maxScore: 100,
      weight: 5,
      details: bulletCount === 0
        ? "No bullet points detected. Use bullets to make achievements scannable."
        : bulletCount < 5
          ? `Only ${bulletCount} bullet points. Aim for 5+ for better readability.`
          : `${bulletCount} bullet points — great for scannability.`,
      status: bulletScore >= 70 ? "good" : bulletScore >= 40 ? "warning" : "bad"
    });

    // 16. Date Coverage (experience timeline)
    const expWithDates = (data.experience || []).filter(e => e.period && e.period.trim()).length;
    let dateScore = 0;
    if (exp.length > 0) {
      dateScore = Math.round((expWithDates / exp.length) * 100);
    }
    checks.push({
      category: "Date Coverage",
      icon: "fa-calendar-alt",
      score: dateScore,
      maxScore: 100,
      weight: 5,
      details: exp.length === 0
        ? "No experience to check dates for."
        : expWithDates === exp.length
          ? "All experience entries have dates. Excellent."
          : `${expWithDates}/${exp.length} entries have dates. Add dates to all positions.`,
      status: dateScore >= 80 ? "good" : dateScore >= 50 ? "warning" : "bad"
    });

    // 17. Volunteer & Leadership
    const volunteer = data.volunteer || [];
    const internships = data.internships || [];
    const leadershipCount = volunteer.length + internships.length;
    let leadershipScore = Math.min(100, leadershipCount * 35);
    checks.push({
      category: "Volunteer & Leadership",
      icon: "fa-hands-helping",
      score: leadershipScore,
      maxScore: 100,
      weight: 4,
      details: leadershipCount === 0
        ? "No volunteer or internship entries. Adding these shows character and initiative."
        : `${leadershipCount} volunteer/internship entries — great for showing well-roundedness.`,
      status: leadershipScore >= 70 ? "good" : leadershipScore >= 40 ? "warning" : "bad"
    });

    // 18. Custom Sections
    const custom = data.custom || [];
    let customScore = Math.min(100, custom.length * 50);
    checks.push({
      category: "Custom Sections",
      icon: "fa-puzzle-piece",
      score: customScore,
      maxScore: 100,
      weight: 3,
      details: custom.length === 0
        ? "No custom sections. Add custom sections for unique qualifications."
        : `${custom.length} custom sections added — great for standing out.`,
      status: customScore >= 70 ? "good" : customScore >= 40 ? "warning" : "bad"
    });

    // Calculate weighted total
    const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
    const weightedTotal = checks.reduce((sum, c) => sum + (c.score * c.weight), 0);
    const overallScore = Math.round(weightedTotal / totalWeight);

    displayResults(checks, overallScore);
  }

  function displayResults(checks, overallScore) {
    const body = document.getElementById("scoreBody");
    if (!body) return;

    const grade = overallScore >= 85 ? "A" : overallScore >= 70 ? "B" : overallScore >= 55 ? "C" : overallScore >= 40 ? "D" : "F";
    const gradeColor = overallScore >= 85 ? "#10b981" : overallScore >= 70 ? "#3b82f6" : overallScore >= 55 ? "#f59e0b" : "#ef4444";
    const gradeLabel = overallScore >= 85 ? "Excellent" : overallScore >= 70 ? "Good" : overallScore >= 55 ? "Fair" : overallScore >= 40 ? "Needs Work" : "Poor";

    const goodCount = checks.filter(c => c.status === "good").length;
    const warningCount = checks.filter(c => c.status === "warning").length;
    const badCount = checks.filter(c => c.status === "bad").length;

    let checksHtml = "";
    checks.forEach(c => {
      const pct = c.score;
      const barColor = c.status === "good" ? "#10b981" : c.status === "warning" ? "#f59e0b" : "#ef4444";
      const statusIcon = c.status === "good" ? "fa-check-circle" : c.status === "warning" ? "fa-exclamation-triangle" : "fa-times-circle";

      checksHtml += `
        <div class="score-check ${c.status}">
          <div class="score-check-header">
            <div class="score-check-icon"><i class="fas ${c.icon}"></i></div>
            <div class="score-check-info">
              <div class="score-check-name">${c.category}</div>
              <div class="score-check-detail">${c.details}</div>
            </div>
            <div class="score-check-score">
              <i class="fas ${statusIcon}"></i>
              <span>${pct}%</span>
            </div>
          </div>
          <div class="score-check-bar">
            <div class="score-check-bar-fill" style="width:${pct}%;background:${barColor};"></div>
          </div>
        </div>
      `;
    });

    body.innerHTML = `
      <div class="score-overview">
        <div class="score-circle" style="--score-color:${gradeColor};">
          <div class="score-circle-value">${overallScore}</div>
          <div class="score-circle-label">/ 100</div>
        </div>
        <div class="score-grade">
          <div class="score-grade-letter" style="color:${gradeColor};">${grade}</div>
          <div class="score-grade-label">${gradeLabel}</div>
        </div>
        <div class="score-summary">
          <div class="score-summary-item good">
            <i class="fas fa-check-circle"></i>
            <span>${goodCount} Strong</span>
          </div>
          <div class="score-summary-item warning">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${warningCount} Needs Attention</span>
          </div>
          <div class="score-summary-item bad">
            <i class="fas fa-times-circle"></i>
            <span>${badCount} Missing</span>
          </div>
        </div>
      </div>

      <div class="score-checks">
        <div class="score-checks-title">Detailed Breakdown (${checks.length} checks)</div>
        ${checksHtml}
      </div>

      <div class="score-tips">
        <div class="score-tips-title"><i class="fas fa-lightbulb"></i> Top Priority Improvements</div>
        ${generateTips(checks)}
      </div>
    `;
  }

  function generateTips(checks) {
    const badItems = checks.filter(c => c.status === "bad");
    const warningItems = checks.filter(c => c.status === "warning");
    const tips = [...badItems, ...warningItems].slice(0, 5);

    if (tips.length === 0) {
      return '<div class="score-tip-good"><i class="fas fa-trophy"></i> Your CV is in great shape! All categories are strong.</div>';
    }

    return tips.map((c, i) => `
      <div class="score-tip ${c.status}">
        <div class="score-tip-num">${i + 1}</div>
        <div class="score-tip-content">
          <div class="score-tip-category">${c.category}</div>
          <div class="score-tip-detail">${c.details}</div>
        </div>
      </div>
    `).join('');
  }

  return {
    open, close, reanalyze
  };
})();
