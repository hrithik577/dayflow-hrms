/**
 * Enterprise Tax & Compensation Calculation Engine for DAYFLOW HRMS.
 * Computes statutory deductions including Provident Fund (PF), Tax Withholding (TDS),
 * and insurance premiums across dynamic compensation brackets.
 */

export const TAX_SLABS = [
  { min: 0, max: 4000, rate: 0.10 },
  { min: 4000, max: 8000, rate: 0.18 },
  { min: 8000, max: 12000, rate: 0.24 },
  { min: 12000, max: Infinity, rate: 0.30 },
];

export const PF_RATE = 0.12; // 12% of basic salary
export const STANDARD_INSURANCE_PREMIUM = 250; // $250 / mo

/**
 * Calculates itemized deductions and net take-home salary.
 */
export function calculatePayrollBreakdown({ basic = 0, hra = 0, allowances = 0 }) {
  const grossMonthly = Number(basic) + Number(hra) + Number(allowances);
  const basicSalary = Number(basic);

  // Provident Fund (PF) Calculation
  const pf = Math.round(basicSalary * PF_RATE);

  // Progressive Tax Withholding (TDS) Calculation
  let estimatedTax = 0;
  for (const slab of TAX_SLABS) {
    if (grossMonthly > slab.min) {
      const taxableInSlab = Math.min(grossMonthly - slab.min, slab.max - slab.min);
      estimatedTax += taxableInSlab * slab.rate;
    }
  }
  const tax = Math.round(estimatedTax);

  // Medical & Group Term Insurance
  const insurance = STANDARD_INSURANCE_PREMIUM;

  const totalDeductions = pf + tax + insurance;
  const netSalary = Math.max(0, grossMonthly - totalDeductions);

  return {
    grossMonthly,
    basic: basicSalary,
    hra: Number(hra),
    allowances: Number(allowances),
    deductions: {
      pf,
      tax,
      insurance,
      totalDeductions,
    },
    netSalary,
    effectiveTaxRate: grossMonthly > 0 ? ((tax / grossMonthly) * 100).toFixed(1) : '0.0',
  };
}
