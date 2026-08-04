"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

interface EmiCalculatorProps {
  price: number;
}

function calculateMonthlyEmi(principal: number, annualRatePct: number, tenureYears: number): number {
  const monthlyRate = annualRatePct / 12 / 100;
  const months = tenureYears * 12;
  if (monthlyRate === 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function EmiCalculator({ price }: EmiCalculatorProps) {
  const minLoan = Math.max(1, Math.round(price * 0.1));
  const [loanAmount, setLoanAmount] = useState(() => Math.round(price * 0.8));
  const [rate, setRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);

  const { emi, totalInterest, totalPayment } = useMemo(() => {
    const monthlyEmi = calculateMonthlyEmi(loanAmount, rate, tenureYears);
    const total = monthlyEmi * tenureYears * 12;
    return {
      emi: Math.round(monthlyEmi),
      totalInterest: Math.round(total - loanAmount),
      totalPayment: Math.round(total),
    };
  }, [loanAmount, rate, tenureYears]);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-lg font-semibold text-foreground">EMI calculator</h2>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="emi-loan-amount" className="text-sm text-muted-foreground">
              Loan amount
            </label>
            <span className="text-sm font-semibold text-foreground">{formatPrice(loanAmount)}</span>
          </div>
          <input
            id="emi-loan-amount"
            type="range"
            min={minLoan}
            max={price}
            step={Math.max(1, Math.round(price / 200))}
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="emi-rate" className="text-sm text-muted-foreground">
              Interest rate
            </label>
            <span className="text-sm font-semibold text-foreground">{rate.toFixed(1)}%</span>
          </div>
          <input
            id="emi-rate"
            type="range"
            min={6}
            max={15}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="emi-tenure" className="text-sm text-muted-foreground">
              Loan tenure
            </label>
            <span className="text-sm font-semibold text-foreground">
              {tenureYears} {tenureYears === 1 ? "year" : "years"}
            </span>
          </div>
          <input
            id="emi-tenure"
            type="range"
            min={1}
            max={30}
            step={1}
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs text-muted-foreground">Monthly EMI</p>
        <p className="text-2xl font-bold text-primary">
          ₹{emi.toLocaleString("en-IN")}
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Total interest</p>
          <p className="font-semibold text-foreground">{formatPrice(totalInterest)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total payment</p>
          <p className="font-semibold text-foreground">{formatPrice(totalPayment)}</p>
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Indicative only — actual EMI depends on the lender&apos;s terms and your credit profile.
      </p>
    </section>
  );
}
