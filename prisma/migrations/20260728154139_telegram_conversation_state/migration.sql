-- CreateTable
CREATE TABLE "TelegramConversationState" (
    "id" TEXT NOT NULL,
    "telegramAccountId" TEXT NOT NULL,
    "flow" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramConversationState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramConversationState_telegramAccountId_key" ON "TelegramConversationState"("telegramAccountId");

-- AddForeignKey
ALTER TABLE "TelegramConversationState" ADD CONSTRAINT "TelegramConversationState_telegramAccountId_fkey" FOREIGN KEY ("telegramAccountId") REFERENCES "TelegramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

