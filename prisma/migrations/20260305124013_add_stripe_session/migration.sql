/*
  Warnings:

  - A unique constraint covering the columns `[stripeSessionId]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "stripeSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_stripeSessionId_key" ON "Ticket"("stripeSessionId");
