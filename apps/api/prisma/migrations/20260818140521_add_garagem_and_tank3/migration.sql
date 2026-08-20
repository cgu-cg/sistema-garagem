-- AlterTable
ALTER TABLE "abastecimentos" ADD COLUMN     "foto_t3" TEXT,
ADD COLUMN     "garagem" TEXT,
ADD COLUMN     "litros_t3" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "garagem" TEXT;
