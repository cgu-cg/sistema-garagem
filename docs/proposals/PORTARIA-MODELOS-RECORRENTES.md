# Portaria: edição direta e funcionamento recorrente

Atualização aprovada em 03/11/2026: recorrentes agora preservam versões por
data de vigência em `trafego_modelo_versao`. Aplicar também o SQL
`docs/sql/2026-11-03-trafego-modelo-versao.sql` antes da nova API.
Detalhes e limitações em `TRAFEGO-VIGENCIA-HISTORICA.md`.

## Solicitação de 03/11/2026

- O botão Editar do card deve abrir diretamente as linhas e configurações,
  sem abrir o formulário de criação.
- Editar linhas, carros, horários, demais campos e funcionamento.
- Modelos Seg–Sex, Sábado e Dom/Fer funcionam recorrentemente nesses grupos.
- Uma programação especial vale para uma única data e tem prioridade sobre
  o modelo recorrente nesse dia, na mesma garagem e turno.

Esta solicitação evolui a decisão anterior, registrada em
TRAFEGO-PROGRAMACAO.md: o editor deixará de atender somente exceções por data.
Os padrões JSON continuarão como base inicial, sem serem sobrescritos em disco.

## Persistência aprovada pelo usuário em 03/11/2026

Adicionar modelo Prisma `TrafegoModelo`, tabela `trafego_modelo`, para guardar
modelos recorrentes. Evita alterar a tabela `trafego_programacao`, seus dados
ou sua chave de identificação por data.

| Campo | Finalidade |
| --- | --- |
| id | Inteiro, chave primária |
| tipo | ESCALA ou SOLTURA |
| nome | Nome do modelo, até 150 caracteres |
| garagem | VCG ou VCM |
| escala_tipo | SEG_SEX, SABADO ou DOM_FER |
| turno | MATUTINO, VESPERTINO ou PADRAO, conforme o contexto |
| revisao | Concorrência otimista, a partir de 1 |
| conteudo | JSON versionado das linhas do modelo |
| responsavel_id | Usuário responsável pela última gravação |
| created_at / updated_at | Auditoria em UTC |

Uma linha por tipo/garagem/tipo de dia/turno. SQL proposto em
`docs/sql/2026-11-03-trafego-modelo.sql`, sem execução automática.
Permissões permanecem ADMIN ou perfil Soltura da própria garagem.

## Fluxo implementado

1. Editar um card abre diretamente o editor com nome, funcionamento e linhas.
2. Padrão recorrente exibe o grupo de dias e turno; programação específica
   exibe sua única data, editável antes do uso operacional.
3. Ao adaptar um recorrente para uma data, salvar uma exceção sem remover o
   recorrente. Ao editar um recorrente, guardar o modelo no banco.
4. Ao mudar a data de uma exceção já salva, atualizar o mesmo cadastro,
   validando revisão, disponibilidade de origem/destino e conflitos. Nunca
   sobrescrever uma programação existente na nova data silenciosamente.
5. Seleção operacional: exceção da data primeiro; modelo recorrente salvo
   depois; JSON original somente se nenhum dos anteriores existir.
6. Preservar as fotografias operacionais já iniciadas/finalizadas. Novos
   modelos não reconstroem históricos nem alteram operações em andamento.
7. Manter o botão Criar como fluxo de criação, incluindo cópia da Soltura
   da mesma data. Cópias permanecem independentes.

Grupo Dom/Fer não implica calendário automático de feriados. Para feriado
em dia útil, usar exceção por data, podendo copiar Dom/Fer como base.

Alterar o tipo de funcionamento cria uma cópia independente e mantém a
origem. Mudar o grupo de dias ou turno de um recorrente também usa revisão
zero no destino: um modelo existente não é sobrescrito silenciosamente.
Para editar esse destino, abrir seu próprio card.

Na Soltura recorrente, carro programado preenchido prevalece; vazio segue
a correspondência com a Escala finalizada, como no padrão anterior. Exceção
por data conserva o comportamento anterior de carros explícitos. Vespertino
permanece sem programados. Os requisitos de CI/Escala não são ampliados.

## Implantação

### Confirmação por linha e ordem no editor

Alterações de campos de uma viagem ficam pendentes até clicar no ✓ da linha,
que valida seus dados. O botão Salvar programação grava o conjunto no banco
e exige confirmar as linhas pendentes. O ✓ sozinho não realiza requisição.
Alças antes de Ordem permitem arrastar por mouse/toque ou mover com setas do
teclado quando a alça está focada. A movimentação fecha o espaço da origem e
renumera de 1 até N; IDs, carros, horários e dados não visíveis são preservados.
Digitar outra Ordem e confirmar também reposiciona a linha. Arrastar confirma
a mudança de posição; demais alterações pendentes continuam exigindo o ✓.
Excluir uma viagem renumera as restantes. Tudo persiste pela revisão e API
existentes, sem alterar schema ou folhas operacionais iniciadas.

Aplicar `docs/sql/2026-11-03-trafego-modelo.sql` no ambiente confirmado pelo
responsável, antes de publicar a nova API/frontend. Gerar o cliente Prisma
no build da API. O script apenas cria a nova tabela; não copia nem remove
exceções e não foi executado pelo agente. Consultas sem fotografia passam
a depender da tabela de modelos. Folhas antigas sem fotografia mantêm sua
interpretação anterior, sem reconstrução a partir de um recorrente novo.

## Verificações executadas

158 testes passaram com rede bloqueada e persistência simulada. Cobrem
prioridade, recorrência, revisão, permissões, mudança de data, colisão de
destino, virada de data durante a gravação e preservação das fotografias de
Escala e Soltura. Builds da API e frontend concluíram; permanece o aviso de
chunk grande já existente no frontend. Cliente Prisma gerado localmente.

Chrome com React real e API simulada via HTTP: Editar abre diretamente sem
modal de criação; recorrente salva e reabre; cópia para uma data preserva o
recorrente; alteração da data atualiza a exceção sem duplicá-la; Criar mantém
o formulário. Conferência visual e largura móvel realizadas.

Nenhuma consulta, migration ou alteração de produção. SQL Server real e
concorrência entre transações reais não foram verificados.
