/*
  Warnings:

  - You are about to drop the column `bus_id` on the `abastecimentos` table. All the data in the column will be lost.
  - You are about to drop the column `hodometro` on the `abastecimentos` table. All the data in the column will be lost.
  - You are about to drop the column `litros` on the `abastecimentos` table. All the data in the column will be lost.
  - You are about to drop the column `motorista` on the `abastecimentos` table. All the data in the column will be lost.
  - You are about to drop the column `valor` on the `abastecimentos` table. All the data in the column will be lost.
  - Added the required column `foto_t1` to the `abastecimentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `foto_t2` to the `abastecimentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `litros_t1` to the `abastecimentos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `litros_t2` to the `abastecimentos` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "abastecimentos" DROP CONSTRAINT "abastecimentos_bus_id_fkey";

-- AlterTable
ALTER TABLE "abastecimentos" DROP COLUMN "bus_id",
DROP COLUMN "hodometro",
DROP COLUMN "litros",
DROP COLUMN "motorista",
DROP COLUMN "valor",
ADD COLUMN     "foto_t1" TEXT NOT NULL,
ADD COLUMN     "foto_t2" TEXT NOT NULL,
ADD COLUMN     "litros_t1" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "litros_t2" DECIMAL(65,30) NOT NULL;
