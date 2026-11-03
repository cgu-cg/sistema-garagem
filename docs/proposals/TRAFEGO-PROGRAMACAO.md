# Tráfego: exceções de escalas e solturas por data

Atualização de 03/11/2026: o menu passou a Portaria → Editar Escalas e
Solturas. A limitação abaixo a exceções por data foi ampliada, com aprovação,
para edição direta de modelos recorrentes. A edição da data de uma exceção
antes do uso também passa a ser permitida. Ver a especificação vigente em
`PORTARIA-MODELOS-RECORRENTES.md`; as demais salvaguardas permanecem.

## Decisões confirmadas pelo usuário

- Menu Tráfego, submenu Alterar escalas e solturas.
- Cards separados de escalas e solturas, com edição e criação.
- Criar do zero ou copiar um modelo existente; editar campos das viagens e adicionar linhas.
- Nome e data de utilização: exceção para uma data específica, sem substituir padrões recorrentes.
- Administrador e perfil Soltura podem criar e editar; autorização deve existir na API.

## Persistência aprovada pelo usuário em 02/11/2026

Adicionar o modelo Prisma `TrafegoProgramacao`, tabela `trafego_programacao`:

| Campo | Finalidade |
| --- | --- |
| id | Identificador inteiro da exceção |
| tipo | ESCALA ou SOLTURA |
| nome | Nome informado pelo usuário |
| garagem | Contexto VCG ou VCM, preservando o isolamento existente |
| escala_tipo | Contexto de aplicação SEG_SEX, SABADO ou DOM_FER |
| turno | MATUTINO, VESPERTINO ou PADRAO, conforme o contexto |
| data_operacao | Data civil de aplicação, formato AAAA-MM-DD |
| revisao | Controle de concorrência para evitar sobrescrever outra edição |
| conteudo | JSON versionado com viagens e IDs estáveis dentro da exceção |
| responsavel_id | Usuário responsável pela gravação |
| created_at / updated_at | Datas de auditoria |

Uma única exceção por tipo, garagem, data, tipo de dia e turno. A escolha da
base é independente do contexto de aplicação: copiar sábado para uma segunda
não altera o sábado padrão nem exige escolher sábado manualmente na operação.
Os JSONs atuais permanecem como padrões quando não houver exceção.

Preparar o SQL Server para revisão, sem executar SQL, migrations ou consultas
ao banco. Implementar validação, permissões e revisão no backend.

## Proteção operacional implementada

Alterar o modelo não deve reescrever folhas operacionais iniciadas ou
finalizadas. A implementação deve preservar a fotografia usada no início e
impedir alteração da programação que já esteja em uso naquele contexto.
Registros históricos não serão reconstruídos com uma exceção nova.

Escalas admitem criação/edição para datas futuras, conforme a janela da
Escala manual existente. Solturas admitem hoje ou futuro, antes de iniciar
ou registrar despachos. Data, garagem e contexto identificam o cadastro;
para outra data deve-se criar uma nova exceção usando a anterior como base.

Cada cópia recebe novas identidades de viagem; edições posteriores preservam
esses IDs. As linhas da escala são fotografadas no JSON da EscalaDiaria ao
iniciar, incluindo os padrões para novos inícios. Registros já existentes
sem fotografia mantêm a interpretação anterior, sem migração automática.

Na Soltura com exceção, o carro programado informado no editor prevalece
sobre o mapeamento automático da escala. CI e Escala finalizadas continuam
obrigatórias no matutino/PADRAO. No vespertino não há carro programado:
permanece somente o realizado na operação. Fretamentos sem tabela passam
pela conferência do tipo e identidade na fotografia oficial do despacho.

As regras de acesso operacional existentes para VCM não são ampliadas por
este editor; cadastrar um modelo não habilita despacho nessa garagem.

## Implantação

Ao criar uma Escala, também é possível copiar uma Soltura já cadastrada para
a mesma data e garagem. O seletor identifica o turno da origem. A cópia usa
novos IDs e somente os campos programados; cadastros permanecem independentes.
Mudar a data limpa essa seleção, evitando copiar por engano outra data.
Não há alteração de schema para essa opção.

SQL para revisão em `docs/sql/2026-11-02-trafego-programacao.sql`. Aplicar a
tabela no ambiente confirmado pelo responsável antes de publicar a API e
frontend juntos. Gerar o cliente Prisma durante o build da API. Nenhum SQL
foi executado pelo agente. A nova API consulta a tabela para contextos sem
fotografia; a implantação exige a tabela disponível, mesmo sem exceções.

Entrada nova: `/trafego/alterar-escalas-solturas`. URLs antigas do editor de
folha redirecionam para essa entrada. Padrões JSON não são modificados pelo
editor. Revisão conflitante exige recarregar e revisar; não há sobrescrita.

Esta proposta complementa docs/MOLDES-ESCALA-SOLTURA.md: a edição dos padrões
JSON continua separada; o novo editor cria exceções persistidas por data.

## Verificações executadas

145 testes locais passaram, incluindo autorização, garagem, datas, revisão,
seleção da exceção, cópia de base, novas viagens e preservação das folhas
iniciadas. As suítes bloquearam rede e usaram persistência simulada.
Builds da API e frontend passaram; o frontend conserva o aviso de chunk grande.

Fluxo real React em Chrome com API simulada via HTTP: copiar sábado para
segunda, editar, adicionar viagem, salvar e reabrir. Revisão de diff e SQL
sem execução. Não foram verificados SQL Server real, concorrência entre
transações reais nem implantação em produção.
