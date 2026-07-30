/*
  Warnings:

  - Added the required column `driver_code` to the `solturas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inicio_linha` to the `solturas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linha` to the `solturas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saida_garagem` to the `solturas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tabela` to the `solturas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "solturas" ADD COLUMN     "driver_code" TEXT NOT NULL,
ADD COLUMN     "inicio_linha" TEXT NOT NULL,
ADD COLUMN     "linha" TEXT NOT NULL,
ADD COLUMN     "programmed_bus_id" INTEGER,
ADD COLUMN     "saida_garagem" TEXT NOT NULL,
ADD COLUMN     "tabela" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "solturas" ADD CONSTRAINT "solturas_programmed_bus_id_fkey" FOREIGN KEY ("programmed_bus_id") REFERENCES "buses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
