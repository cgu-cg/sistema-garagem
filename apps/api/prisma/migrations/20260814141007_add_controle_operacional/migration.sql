-- CreateTable
CREATE TABLE "controleOperacional" (
    "id" SERIAL NOT NULL,
    "carro" TEXT NOT NULL,
    "linha" TEXT NOT NULL,
    "garagem" TEXT NOT NULL,
    "foto1" TEXT NOT NULL,
    "foto2" TEXT,
    "foto3" TEXT,
    "data_insercao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "controleOperacional_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "controleOperacional" ADD CONSTRAINT "controleOperacional_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
