/**
 * Financing calculator.
 * Standard amortized monthly payment used by the vehicle page and the
 * dedicated financing page. Deterministic and shared so the figure a customer
 * sees always matches what is stored on a lead.
 */

export interface FinancingInput {
  price: number;
  downPayment: number;
  termMonths: number;
  /** Nominal annual interest rate as a fraction, e.g. 0.069 for 6.9%. */
  annualRate: number;
}

export interface FinancingResult {
  monthly: number;
  financedAmount: number;
  totalPayable: number;
  totalInterest: number;
}

export const FINANCING_DEFAULTS = {
  annualRate: 0.069,
  terms: [12, 24, 36, 48, 60, 72] as const,
  defaultTerm: 60,
  /** Default deposit as a fraction of price. */
  defaultDownRate: 0.2,
  minDownRate: 0.1,
};

export function computeFinancing({
  price,
  downPayment,
  termMonths,
  annualRate,
}: FinancingInput): FinancingResult {
  const financedAmount = Math.max(price - downPayment, 0);
  const monthlyRate = annualRate / 12;

  let monthly: number;
  if (financedAmount === 0) {
    monthly = 0;
  } else if (monthlyRate === 0) {
    monthly = financedAmount / termMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, termMonths);
    monthly = (financedAmount * monthlyRate * factor) / (factor - 1);
  }

  const totalPayable = monthly * termMonths + downPayment;

  return {
    monthly: Math.round(monthly),
    financedAmount: Math.round(financedAmount),
    totalPayable: Math.round(totalPayable),
    totalInterest: Math.round(monthly * termMonths - financedAmount),
  };
}
