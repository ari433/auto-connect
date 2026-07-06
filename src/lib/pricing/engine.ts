/**
 * AUTO CONNECT Pricing Engine
 *
 * Converts an upstream listing price (KRW) into a transparent, customer-facing
 * EUR price. The engine is deterministic and fully configurable via env so the
 * commercial team can tune margins without code changes. It returns a full
 * breakdown for the admin dashboard while only the final `price` is ever
 * exposed to customers.
 */

export interface PricingConfig {
  /** KRW → EUR exchange rate. */
  fxKrwToEur: number;
  /** Sea + inland freight and export handling, in EUR. */
  logisticsEur: number;
  /** Import duty as a fraction of the CIF value (customs). */
  dutyRate: number;
  /** Value added tax as a fraction (Kosovo VAT = 18%). */
  vatRate: number;
  /** Homologation, registration prep and inspection, in EUR. */
  complianceEur: number;
  /** Gross margin as a fraction of landed cost. */
  marginRate: number;
  /** Minimum absolute margin floor, in EUR. */
  minMarginEur: number;
  /** Final price is rounded up to this step, in EUR. */
  roundingStepEur: number;
  /** Flat markup added to the final customer price (demo/promotional lever). */
  demoMarkupEur: number;
}

export interface PriceBreakdown {
  sourcePriceKrw: number;
  sourcePriceEur: number;
  logisticsEur: number;
  dutyEur: number;
  complianceEur: number;
  vatEur: number;
  landedCostEur: number;
  marginEur: number;
  /** Final customer price in EUR. */
  price: number;
}

function num(env: string | undefined, fallback: number): number {
  const parsed = env ? Number(env) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Resolve pricing config from environment with production-sane defaults. */
export function getPricingConfig(): PricingConfig {
  return {
    fxKrwToEur: num(process.env.PRICING_FX_KRW_EUR, 0.00069),
    logisticsEur: num(process.env.PRICING_LOGISTICS_EUR, 1650),
    dutyRate: num(process.env.PRICING_DUTY_RATE, 0.1),
    vatRate: num(process.env.PRICING_VAT_RATE, 0.18),
    complianceEur: num(process.env.PRICING_COMPLIANCE_EUR, 450),
    marginRate: num(process.env.PRICING_MARGIN_RATE, 0.12),
    minMarginEur: num(process.env.PRICING_MIN_MARGIN_EUR, 1800),
    roundingStepEur: num(process.env.PRICING_ROUNDING_EUR, 100),
    demoMarkupEur: num(process.env.PRICING_DEMO_MARKUP_EUR, 0),
  };
}

/** Round a value up to the nearest `step`. */
function roundUpTo(value: number, step: number): number {
  if (step <= 0) return Math.round(value);
  return Math.ceil(value / step) * step;
}

/**
 * Compute the full price breakdown for a source vehicle.
 * `priceKrw` is the upstream listing price in South Korean won.
 */
export function computePrice(
  priceKrw: number,
  config: PricingConfig = getPricingConfig(),
): PriceBreakdown {
  const sourcePriceEur = priceKrw * config.fxKrwToEur;

  // CIF ≈ vehicle value + freight; duty is levied on the CIF value.
  const cif = sourcePriceEur + config.logisticsEur;
  const dutyEur = cif * config.dutyRate;

  // VAT applies on the duty-inclusive value plus local compliance costs.
  const vatBase = cif + dutyEur + config.complianceEur;
  const vatEur = vatBase * config.vatRate;

  const landedCostEur =
    sourcePriceEur +
    config.logisticsEur +
    dutyEur +
    config.complianceEur +
    vatEur;

  const marginEur = Math.max(
    landedCostEur * config.marginRate,
    config.minMarginEur,
  );

  const price =
    roundUpTo(landedCostEur + marginEur, config.roundingStepEur) +
    config.demoMarkupEur;

  return {
    sourcePriceKrw: priceKrw,
    sourcePriceEur: Math.round(sourcePriceEur),
    logisticsEur: Math.round(config.logisticsEur),
    dutyEur: Math.round(dutyEur),
    complianceEur: Math.round(config.complianceEur),
    vatEur: Math.round(vatEur),
    landedCostEur: Math.round(landedCostEur),
    marginEur: Math.round(price - landedCostEur),
    price,
  };
}
