import { redirect } from "next/navigation";
import { requireTenantContext } from "@/server/auth/require-tenant-context";
import { getOnboardingState } from "@/server/onboarding/onboarding-service";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function KurulumPage() {
  const ctx = await requireTenantContext();
  const { company, bank, pos } = await getOnboardingState(ctx);

  if (company.onboardingCompletedAt) {
    redirect("/panel");
  }

  return (
    <OnboardingWizard
      initialStep={company.onboardingStep}
      company={{
        name: company.name,
        shortName: company.shortName,
        taxNumber: company.taxNumber,
        contactName: company.contactName,
        phone: company.phone,
        email: company.email,
        city: company.city,
        district: company.district,
        sector: company.sector,
        estimatedAnnualVolume: company.estimatedAnnualVolume
          ? Number(company.estimatedAnnualVolume)
          : null,
        branchCount: company.branchCount,
      }}
      bank={
        bank
          ? {
              bankName: bank.name,
              branchName: bank.branchName,
              customerNumber: bank.customerNumber,
              note: bank.note,
            }
          : null
      }
      pos={
        pos
          ? { posName: pos.name, terminalNo: pos.terminalNo, merchantNo: pos.merchantNo }
          : null
      }
      draft={(company.onboardingDraft as Record<string, unknown> | null) ?? null}
    />
  );
}
