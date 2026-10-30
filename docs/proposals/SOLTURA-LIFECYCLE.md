# Proposta: inicio, finalizacao e relatorio da Soltura

Decisoes do usuario em 30/10/2026: finalizar exige todas as viagens liberadas;
somente ADMIN reabre. Matutino/PADRAO preservam os requisitos da CI/Escala;
vespertino continua independente. Escrita continua no dia da operacao e nas
garagens ja autorizadas. Impressao permite consulta de datas anteriores.

## Persistencia autorizada (modelo implementado; SQL nao executado)

Nova tabela `soltura_folha`, independente de CI e Escala de Carros. Uma folha
por garagem, data operacional, tipo de escala e turno. Os despachos continuam
na tabela `solturas`; a folha controla seu ciclo e fotografa os dados do relatorio.

```prisma
model FolhaSoltura {
  id            Int      @id @default(autoincrement())
  garagem       String   @db.NVarChar(10)
  escalaTipo    String   @map("escala_tipo") @db.NVarChar(10)
  turno         String   @db.NVarChar(10)
  dataOperacao  String   @map("data_operacao") @db.NVarChar(10)
  status        String   @db.NVarChar(20)
  revisao       Int      @default(1)
  conteudo      String   @db.NVarChar(Max)
  responsavelId Int      @map("responsavel_id")
  createdAt     DateTime @default(dbgenerated("SYSUTCDATETIME()")) @map("created_at") @db.DateTime2
  updatedAt     DateTime @default(dbgenerated("SYSUTCDATETIME()")) @updatedAt @map("updated_at") @db.DateTime2

  @@unique([garagem, escalaTipo, turno, dataOperacao], map: "UQ_soltura_folha_contexto")
  @@map("soltura_folha")
}
```

`status`: EM_ANDAMENTO ou FINALIZADA. Ausencia da folha significa nao iniciada.
`conteudo`: version, molde fotografado no inicio, eventos iniciar/finalizar/
reabrir com usuario e horario do servidor e, ao finalizar, fotografia dos
despachos e dados auxiliares do relatorio. Nao inventar motivos, assinatura,
numero de revisao documental ou datas administrativas copiadas das fotos.

Inicio, gravacao de despachos e finalizacao compartilham locks e transacao.
POST de despacho exige folha em andamento; finalizar verifica as viagens
oficiais no banco, sem confiar em contadores do frontend. ADMIN reabre por
comando auditado, sem apagar despachos. Revisao evita comandos concorrentes.

Nenhum registro antigo e apagado, convertido ou finalizado automaticamente.
Iniciar uma folha de hoje com despachos ja existentes deve preserva-los.
Historicos sem folha continuam consultaveis. Relatorio nao usa filtro de busca
para omitir linhas e nao usa dados atuais para substituir fotografia finalizada.

## Entrega e aplicacao

Proposta aprovada pelo usuario em 30/10/2026. Modelo incluido no schema.prisma;
SQL preparado em docs/sql/2026-10-30-soltura-folha.sql para revisao separada.
Nao foram executados DDL, migrations ou alteracoes operacionais.
Antes de ativar o controle, aplicar a tabela no ambiente explicitamente
confirmado pelo responsavel. A aplicacao nao deve simular inicio/finalizacao
em localStorage quando a persistencia oficial estiver indisponivel.

Depois de aplicar a tabela no ambiente confirmado: gerar o Prisma Client,
executar builds da API/web e reiniciar a API pelo procedimento de deploy.
O ambiente local mantinha a DLL do Prisma em uso; a geracao completa foi
validada em diretorio temporario isolado, sem encerrar processos do usuario.
