"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Stepper, ONBOARDING_STEPS } from "@/components/onboarding/stepper";
import { CompanyStep, type CompanyStepDefaults } from "@/components/onboarding/steps/company-step";
import { BankStep, type BankStepDefaults } from "@/components/onboarding/steps/bank-step";
import { PosStep, type PosStepDefaults } from "@/components/onboarding/steps/pos-step";
import { TariffStep } from "@/components/onboarding/steps/tariff-step";
import { ReviewStep, type ReviewStepData } from "@/components/onboarding/steps/review-step";
import type {
  BankInfoInput,
  CompanyInfoInput,
  PosInfoInput,
  TariffInfoInput,
} from "@/server/onboarding/schemas";

export interface OnboardingWizardProps {
  initialStep: number;
  company: CompanyStepDefaults;
  bank: BankStepDefaults | null;
  pos: PosStepDefaults | null;
  draft: Record<string, unknown> | null;
}

export function OnboardingWizard({
  initialStep,
  company,
  bank,
  pos,
  draft,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(initialStep);
  const [reviewData, setReviewData] = useState<ReviewStepData | null>(null);
  const currentLabel = ONBOARDING_STEPS.find((s) => s.number === step)?.label ?? "";

  useEffect(() => {
    if (step !== 5) return;
    let cancelled = false;
    fetch("/api/onboarding/state")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setReviewData(data);
      })
      .catch(() => {
        if (!cancelled) setReviewData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [step]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{currentLabel}</span>
          <span>{step}/5</span>
        </div>
        <Progress value={(step / 5) * 100} className="mt-2 h-1.5" />
      </div>

      <div className="mx-auto flex max-w-4xl gap-8 px-4 py-8 lg:px-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="mb-6 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground">
              P
            </span>
            <span className="font-heading text-lg font-semibold text-navy">POSKontrol</span>
          </div>
          <Stepper current={step} />
        </aside>

        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          {step === 1 ? (
            <CompanyStep
              defaultValues={company}
              draft={step === initialStep ? (draft as Partial<CompanyInfoInput> | null) : null}
              onNext={() => setStep(2)}
            />
          ) : null}
          {step === 2 ? (
            <BankStep
              defaultValues={
                bank ?? { bankName: null, branchName: null, customerNumber: null, note: null }
              }
              draft={step === initialStep ? (draft as Partial<BankInfoInput> | null) : null}
              onNext={() => setStep(3)}
            />
          ) : null}
          {step === 3 ? (
            <PosStep
              defaultValues={pos ?? { posName: null, terminalNo: null, merchantNo: null }}
              draft={step === initialStep ? (draft as Partial<PosInfoInput> | null) : null}
              onNext={() => setStep(4)}
            />
          ) : null}
          {step === 4 ? (
            <TariffStep
              draft={step === initialStep ? (draft as Partial<TariffInfoInput> | null) : null}
              onNext={() => setStep(5)}
            />
          ) : null}
          {step === 5 && reviewData ? (
            <ReviewStep
              data={reviewData}
              onCompleted={() => {
                // Sert yönlendirme: client router cache'in kurulum-öncesi
                // yönlendirmeyi tekrar kullanmasını önler.
                window.location.assign("/");
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
