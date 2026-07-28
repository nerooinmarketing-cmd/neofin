import type { StatusTone } from "@/components/shared/status-badge";

export interface MockPayment {
  id: string;
  bankName: string;
  posName: string;
  saleDate: string;
  paymentDate: string;
  grossAmount: number;
  expectedDeduction: number;
  expectedNet: number;
  status: { label: string; tone: StatusTone };
}

export const mockPendingPayments: MockPayment[] = [
  {
    id: "pay-1",
    bankName: "Akbank",
    posName: "POS-01 · Merkez Şube",
    saleDate: "2026-08-12",
    paymentDate: "2026-08-13",
    grossAmount: 35000,
    expectedDeduction: 1257.5,
    expectedNet: 33742.5,
    status: { label: "Bugün yatmalı", tone: "warning" },
  },
  {
    id: "pay-2",
    bankName: "Yapı Kredi",
    posName: "POS-03 · Bağdat Cd.",
    saleDate: "2026-08-11",
    paymentDate: "2026-08-13",
    grossAmount: 21500,
    expectedDeduction: 645,
    expectedNet: 20855,
    status: { label: "Bekleniyor", tone: "info" },
  },
];

export interface MockBank {
  id: string;
  bankName: string;
  activePosCount: number;
  monthlyRevenue: number;
  avgCommissionRate: number;
  pendingPayment: number;
  status: { label: string; tone: StatusTone };
}

export const mockBanks: MockBank[] = [
  {
    id: "bank-1",
    bankName: "Akbank",
    activePosCount: 3,
    monthlyRevenue: 612400,
    avgCommissionRate: 2.85,
    pendingPayment: 33742.5,
    status: { label: "Uyumlu", tone: "success" },
  },
  {
    id: "bank-2",
    bankName: "Yapı Kredi",
    activePosCount: 2,
    monthlyRevenue: 348900,
    avgCommissionRate: 3.1,
    pendingPayment: 20855,
    status: { label: "Kontrol edilmeli", tone: "warning" },
  },
  {
    id: "bank-3",
    bankName: "Garanti BBVA",
    activePosCount: 1,
    monthlyRevenue: 154200,
    avgCommissionRate: 2.6,
    pendingPayment: 0,
    status: { label: "Bilgi yok", tone: "neutral" },
  },
];

export interface MockPos {
  id: string;
  posName: string;
  terminalNo: string;
  posType: string;
  activeTariffName: string | null;
  lastTransactionDate: string | null;
  monthlyRevenue: number;
  monthlyDeduction: number;
  status: { label: string; tone: StatusTone };
}

export const mockPosDevices: MockPos[] = [
  {
    id: "pos-1",
    posName: "POS-01 · Merkez Şube",
    terminalNo: "TR001234",
    posType: "Fiziksel",
    activeTariffName: "Akbank Tarife v3",
    lastTransactionDate: "2026-08-12",
    monthlyRevenue: 245000,
    monthlyDeduction: 8820,
    status: { label: "Aktif", tone: "success" },
  },
  {
    id: "pos-2",
    posName: "POS-02 · Sanal",
    terminalNo: "TR005678",
    posType: "Sanal",
    activeTariffName: null,
    lastTransactionDate: null,
    monthlyRevenue: 0,
    monthlyDeduction: 0,
    status: { label: "Tarife yok", tone: "neutral" },
  },
];
