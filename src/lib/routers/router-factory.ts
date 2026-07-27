import { routerConfigs, RouterConfig } from './router-config';

/**
 * Normalize plan name to lowercase key
 * @param plan - The plan key from database (e.g., "go_plus", "pro", "plus_pro")
 *   Also accepts display names ("Go Plus", "+ Pro") for backward compatibility.
 * @returns Normalized plan key (e.g., "go_plus", "pro", "plus_pro")
 */
function normalizePlanName(plan: string): string {
  const planMap: Record<string, string> = {
    'free': 'free',
    'Go Plus': 'go_plus',
    'go_plus': 'go_plus',
    'Pro': 'pro',
    'pro': 'pro',
    '+ Pro': 'plus_pro',
    'plus_pro': 'plus_pro',
  };
  return planMap[plan] || 'free';
}

/**
 * Get the router configuration for a given plan
 * @param plan - The plan name (e.g., "free", "go_plus", "pro", "plus_pro", "Go Plus", "+ Pro")
 * @returns The router configuration for the plan, defaults to free config if plan not found
 */
export function getRouterConfig(plan: string): RouterConfig {
  const normalizedPlan = normalizePlanName(plan);
  return routerConfigs[normalizedPlan] ?? routerConfigs.free;
}
