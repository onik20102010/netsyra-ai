import { useState, useEffect } from 'react';
import { createIdeClient } from '@/lib/supabase/client';

export interface AgentLimitStatus {
  messagesSent: number;
  remaining: number;
  windowStart: string;
  windowEnd: string;
  resetInSeconds: number;
}

export function useAgentMessageLimit(userId: string | null) {
  const [status, setStatus] = useState<AgentLimitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!userId) {
      setStatus(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createIdeClient();
      const { data, error } = await supabase
        .rpc('get_agent_message_limit_status', {
          p_user_id: userId,
          p_limit: 3,
          p_window_hours: 24,
        });

      if (error) throw error;

      if (data && data.length > 0) {
        setStatus(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to fetch agent limit status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [userId]);

  return { status, loading, error, refetch: fetchStatus };
}
