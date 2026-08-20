-- CreateTable
CREATE TABLE "abastecimento_carro_sessions" (
    "id" SERIAL NOT NULL,
    "matricula" TEXT NOT NULL,
    "dth_ini_abastec" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dth_fim_abastec" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "garagem" TEXT,
    "b1_ini" DECIMAL(65,30),
    "b2_ini" DECIMAL(65,30),
    "b3_ini" DECIMAL(65,30),
    "b4_ini" DECIMAL(65,30),
    "b5_ini" DECIMAL(65,30),
    "b6_ini" DECIMAL(65,30),
    "b1_fim" DECIMAL(65,30),
    "b2_fim" DECIMAL(65,30),
    "b3_fim" DECIMAL(65,30),
    "b4_fim" DECIMAL(65,30),
    "b5_fim" DECIMAL(65,30),
    "b6_fim" DECIMAL(65,30),
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abastecimento_carro_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abastecimento_carro_items" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "carro" TEXT NOT NULL,
    "litros" DECIMAL(65,30) NOT NULL,
    "bomba" TEXT NOT NULL,
    "foto" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "garagem" TEXT,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abastecimento_carro_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "abastecimento_carro_sessions" ADD CONSTRAINT "abastecimento_carro_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abastecimento_carro_items" ADD CONSTRAINT "abastecimento_carro_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "abastecimento_carro_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
