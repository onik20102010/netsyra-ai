// Token-based usage tracking for Go Plus and higher plans
// This tracks token consumption instead of message count

export interface TokenUsageResult {
  allowed: boolean;
  dailyTokensUsed: number;
  monthlyTokensUsed: number;
  dailyRemaining: number;
  monthlyRemaining: number;
  dailyResetAt: string;
  monthlyResetAt: string;
}

export async function checkTokenLimits(
  supabase: any,
  userId: string,
  modelTier: string,
  dailyLimit: number,
  monthlyLimit: number,
  modelKey?: string
): Promise<TokenUsageResult> {
  console.log(`🔍 Token limit check: userId=${userId}, tier=${modelTier}, modelKey=${modelKey}, dailyLimit=${dailyLimit}, monthlyLimit=${monthlyLimit}`);

  try {
    const { data, error } = await supabase.rpc('check_token_limits', {
      p_user_id: userId,
      p_model_tier: modelTier,
      p_model_key: modelKey || null,
      p_daily_limit: dailyLimit,
      p_monthly_limit: monthlyLimit
    });

    if (error) {
      console.error('Token limit check failed:', error);
      throw error;
    }

    return {
      allowed: data.allowed,
      dailyTokensUsed: data.daily_tokens_used,
      monthlyTokensUsed: data.monthly_tokens_used,
      dailyRemaining: data.daily_remaining,
      monthlyRemaining: data.monthly_remaining,
      dailyResetAt: data.daily_reset_at,
      monthlyResetAt: data.monthly_reset_at
    };
  } catch (error) {
    console.error('Failed to check token limits:', error);
    throw error;
  }
}

export async function incrementTokenUsage(
  supabase: any,
  userId: string,
  modelTier: string,
  tokensUsed: number,
  modelKey?: string
): Promise<void> {
  console.log(`📊 Incrementing token usage: userId=${userId}, tier=${modelTier}, modelKey=${modelKey}, tokens=${tokensUsed}`);

  try {
    const { data, error } = await supabase.rpc('increment_token_usage', {
      p_user_id: userId,
      p_model_tier: modelTier,
      p_model_key: modelKey || null,
      p_tokens: tokensUsed
    });

    if (error) {
      console.error('Token usage increment failed:', error);
      throw error;
    }

    console.log(`✅ Token usage incremented:`, data);
  } catch (error) {
    console.error('Failed to increment token usage:', error);
    throw error;
  }
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}
