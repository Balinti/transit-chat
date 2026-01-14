import { Entitlements, SubscriptionPlan, Subscription } from '@/types';

export function getEntitlements(subscription: Subscription | null): Entitlements {
  const plan = subscription?.plan || 'free';
  const isActive =
    subscription &&
    ['active', 'trialing'].includes(subscription.status) &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end) > new Date();

  const effectivePlan: SubscriptionPlan = isActive ? plan : 'free';

  switch (effectivePlan) {
    case 'pro':
      return {
        plan: 'pro',
        commutes_limit: 5,
        categories_limited: false,
        early_warning: true,
        confidence_breakdown: true,
        reliability_history: true,
      };
    case 'plus':
      return {
        plan: 'plus',
        commutes_limit: 5,
        categories_limited: false,
        early_warning: false,
        confidence_breakdown: true,
        reliability_history: false,
      };
    case 'free':
    default:
      return {
        plan: 'free',
        commutes_limit: 1,
        categories_limited: true,
        early_warning: false,
        confidence_breakdown: false,
        reliability_history: false,
      };
  }
}

export function getPlanLimits(plan: SubscriptionPlan) {
  return getEntitlements({ plan, status: 'active', current_period_end: new Date(Date.now() + 86400000).toISOString() } as Subscription);
}
