import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/server/tenant-context";
import { NotFoundError } from "@/server/errors";
import { saveUploadedFile } from "@/server/storage/file-storage";
import { contractAnalysisProvider } from "@/server/contract-analysis/mock-provider";

/** Güven skoru bunun altındaysa sonuç "manuel kontrol gerekli" sayılır. */
const CONFIDENCE_MANUAL_REVIEW_THRESHOLD = 0.5;
const STAGE_DELAY_MS = 700;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface CreateContractInput {
  title: string;
  bankId?: string;
  posId?: string;
  files: File[];
}

export const contractRepository = {
  listAll(ctx: TenantContext) {
    return prisma.contract.findMany({
      where: { companyId: ctx.companyId, deletedAt: null },
      include: { bank: true, pos: true, analysis: true, pages: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getByIdOrThrow(ctx: TenantContext, id: string) {
    const contract = await prisma.contract.findFirst({
      where: { id, companyId: ctx.companyId, deletedAt: null },
      include: {
        bank: true,
        pos: true,
        pages: { orderBy: { pageNumber: "asc" } },
        analysis: { include: { risks: true, questions: true } },
      },
    });
    if (!contract) throw new NotFoundError("Contract", id);
    return contract;
  },

  async create(ctx: TenantContext, input: CreateContractInput) {
    const scope = `contracts/${ctx.companyId}`;
    const stored = await Promise.all(input.files.map((file) => saveUploadedFile(file, scope)));

    return prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          companyId: ctx.companyId,
          bankId: input.bankId,
          posId: input.posId,
          title: input.title,
          createdById: ctx.companyUserId,
          pages: {
            create: stored.map((file, index) => ({
              pageNumber: index + 1,
              fileUrl: file.url,
            })),
          },
        },
        include: { pages: true },
      });

      await tx.auditLog.create({
        data: {
          companyId: ctx.companyId,
          actorType: "USER",
          actorUserId: ctx.companyUserId,
          action: "CONTRACT_UPLOAD",
          entityType: "Contract",
          entityId: contract.id,
          after: { title: contract.title, pageCount: stored.length },
        },
      });

      return contract;
    });
  },

  /**
   * Aşama 10 boru hattı: yüklendi → metin çıkarılıyor → maddeler
   * sınıflandırılıyor → finansal etki hesaplanıyor → tamamlandı/manuel
   * kontrol gerekli. Aşama geçişleri gerçek DB güncellemeleridir (istemci
   * bunları polling ile izleyebilir); `contractAnalysisProvider` şu an
   * mock'tur, gerçek OCR/AI henüz bağlanmadı.
   */
  async runAnalysis(ctx: TenantContext, id: string) {
    const contract = await this.getByIdOrThrow(ctx, id);
    if (contract.analysis) return contract;

    await prisma.contract.update({ where: { id }, data: { status: "EXTRACTING_TEXT" } });
    await delay(STAGE_DELAY_MS);

    await prisma.$transaction(
      contract.pages.map((page) =>
        prisma.contractPage.update({
          where: { id: page.id },
          data: {
            extractedText: `(${contract.title} — sayfa ${page.pageNumber}: gerçek OCR henüz bağlanmadı, mock sağlayıcı kullanılıyor)`,
          },
        }),
      ),
    );

    await prisma.contract.update({ where: { id }, data: { status: "CLASSIFYING_CLAUSES" } });
    await delay(STAGE_DELAY_MS);

    await prisma.contract.update({ where: { id }, data: { status: "CALCULATING_IMPACT" } });
    await delay(STAGE_DELAY_MS);

    const result = await contractAnalysisProvider.analyzeDocument({
      title: contract.title,
      pages: contract.pages.map((p) => ({
        pageNumber: p.pageNumber,
        extractedText: p.extractedText ?? "",
      })),
    });

    const finalStatus =
      result.confidenceScore < CONFIDENCE_MANUAL_REVIEW_THRESHOLD ? "NEEDS_MANUAL_REVIEW" : "COMPLETED";

    try {
      await prisma.$transaction(async (tx) => {
        await tx.contractAnalysis.create({
          data: {
            contractId: id,
            summary60s: result.summary60s,
            advantages: result.advantages as unknown as Prisma.InputJsonValue,
            attentionPoints: result.attentionPoints as unknown as Prisma.InputJsonValue,
            commissionSummary: result.financialImpact as unknown as Prisma.InputJsonValue,
            comparableTerms: result.comparableTerms as unknown as Prisma.InputJsonValue,
            valorSummary: result.valorSummary,
            volumeCommitmentNote: result.volumeCommitmentNote,
            earlyTerminationNote: result.earlyTerminationNote,
            autoRenewalNote: result.autoRenewalNote,
            unilateralChangeNote: result.unilateralChangeNote,
            confidenceScore: result.confidenceScore,
            createdById: ctx.companyUserId,
            risks: {
              create: result.risks.map((r) => ({
                text: r.text,
                severity: r.severity,
                sourcePageNumber: r.sourcePageNumber,
                sourceClauseRef: r.sourceClauseRef,
                suggestedCorrection: r.suggestedCorrection,
              })),
            },
            questions: { create: result.questions.map((q) => ({ question: q })) },
          },
        });

        await tx.contract.update({ where: { id }, data: { status: finalStatus } });

        await tx.auditLog.create({
          data: {
            companyId: ctx.companyId,
            actorType: "AI",
            action: "CONTRACT_ANALYSIS_COMPLETE",
            entityType: "Contract",
            entityId: id,
            after: { status: finalStatus, confidenceScore: result.confidenceScore },
          },
        });
      });
    } catch (error) {
      // Eşzamanlı bir çağrı (ör. iki sekme/çift istek) analizi bizden önce
      // tamamlamış olabilir. `ContractAnalysis.contractId` bu modeldeki tek
      // @unique alan olduğundan, bu insert'ten gelen herhangi bir P2002
      // yalnızca bu yarışı ifade eder — hatayı yutup mevcut sonucu döneriz.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        throw error;
      }
    }

    return this.getByIdOrThrow(ctx, id);
  },
};
