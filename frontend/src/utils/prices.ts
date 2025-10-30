export const PRICE_TIERS: Record<number, number> = {
  1: 150,
  2: 100,
  3: 75,
};

export const getPriceForTier = (tier: number): number => {
  return PRICE_TIERS[tier] ?? 50;
};

export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

