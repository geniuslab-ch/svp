-- AlterTable
ALTER TABLE "Venture" ADD COLUMN     "priceFloor" INTEGER,
ADD COLUMN     "publicMonthlyRevenue" DOUBLE PRECISION,
ADD COLUMN     "tractionScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
