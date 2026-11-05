# Controle de Manutencao independente

## Decisoes de 30/10/2026

O Controle permanece no Sistema Garagem. Bloqueados, Em Manutencao e
Liberados pertencem somente ao Controle. A CI nao recebe suas alteracoes,
nem fornece estados para novas folhas. A Soltura matutina/PADRAO nao consulta
manutencao para impedir despachos; continua validando sua CI e Escala.

Atualizacao de 04/11/2026: na virada da data civil America/Campo_Grande,
Bloqueados, Em Manutencao e Liberados comecam vazios, sem copiar carros ou
observacoes do dia anterior. Esta regra substitui a continuidade dos bloqueados.
O retorno automatico dos liberados para Em Manutencao continua cancelado.
Nao sao incluidos todos os carros da frota automaticamente.

A virada e uma projecao de leitura baseada na ultima folha independente:
nao depende de job, da hora de abrir a tela ou de a CI estar iniciada/finalizada.
O primeiro comando do novo dia persiste a folha. GET nunca cria ou altera
linhas. Se a API ficar dias desligada, nao inventa folhas intermediarias.
Historico ja salvo permanece intacto. Uma folha explicitamente salva vazia
continua vazia na virada seguinte.

## Operacao

Menus e arraste entre os tres quadros usam a mesma gravacao autenticada.
Liberar um bloqueado exige confirmacao. Arraste nativo atende desktop;
os menus permanecem utilizaveis por teclado e em telas de toque.

Permissoes preservadas: ADMIN pode atuar na garagem selecionada;
manutencao vinculada a VCG pode atuar na VCG. Nao se habilitou automaticamente
perfil manutencao VCM. A janela existente continua 03:00 ate 20:00, apenas
na data atual. As restricoes sao verificadas novamente na transacao.

## Offline e conflitos

O endereco de producao HTTP por IP de rede nao e um contexto seguro para
Service Worker. O Controle aberto funciona sem `crypto.subtle` ou
`crypto.randomUUID`: o hash de revisao usa SHA-256 compativel com o servidor
e os UUIDs usam `crypto.getRandomValues` quando a API nativa nao existe.
Isso corrige o carregamento/gravacao em HTTP, mas nao habilita instalacao e
reabertura offline do PWA. Para essas funcionalidades, disponibilizar HTTPS
com certificado confiavel nos aparelhos. Nenhuma infraestrutura foi alterada.
Testes em localhost nao substituem esse caso: localhost e tratado como
contexto seguro pelo navegador, ao contrario de HTTP por IP da rede.

O PWA e a sessao devem estar disponiveis no aparelho. O PWA existente guarda
os arquivos acessados; o Controle usa IndexedDB para uma fotografia e fila
por usuario, garagem e data. O cadastro `inventoryCars.ts`, embarcado no
frontend, alimenta o seletor mesmo sem consultar a API. A convencao local
1xxx/2002 VCM e demais VCG e usada somente como cadastro inicial; a frota
oficial consultada e seu cache podem atualizar inclusive a garagem fisica.
A API revalida a frota ao sincronizar.

Nao e obrigatorio carregar cada nova data no Wi-Fi: sem copia do dia, o
aplicativo inicia com todos os quadros vazios. A folha anterior em cache nao
fornece carros nem observacoes para o novo dia. Estados de uma fila ainda nao
confirmada tambem nao alimentam a virada.
A base de revisao corresponde a fonte local conhecida; se outro dispositivo
mudou o banco, a sincronizacao recusa a base antiga sem sobrescrever o servidor.
Na ausencia de cache, o aplicativo nao conhece bloqueios adicionados em outros
aparelhos; a copia local nao representa uma consulta atual do banco.
O timeout de consulta/envio do Controle e 5 segundos para lidar com dados
moveis ativos sem acesso a API interna.

Cada comando tem UUID, revisao de origem, itens e confirmacao. Fotografia e
fila ficam juntas em uma escrita local. Comparacao/escrita atomica no
IndexedDB impede que duas abas apaguem a fila uma da outra. Nao se copiam
tokens ou senhas para essa fila. O mecanismo nao usa a fila generica de
vistorias, evitando mistura com a sincronizacao do Controle Operacional.

Ao reconectar, voltar a aba ou entrar novamente na pagina, os comandos sao
enviados em ordem. A tela aberta tambem consulta a cada 30 segundos, sem
vinculo com eventos da CI. Reenvio de comando ja recebido nao duplica a
gravacao: UUID, hash do conteudo e autor sao conferidos na folha do servidor.

Um conflito nao descarta a fila nem substitui o servidor. O quadro local e
identificado como pendente, a mensagem explica o impedimento e novas edicoes
ficam suspensas ate revisao. `Sincronizar` tenta novamente. `Descartar pendencias
locais` exige confirmacao e consulta bem sucedida antes de substituir a copia.
Alteracoes que o servidor ja recebeu continuam preservadas mesmo no descarte.
Nao ha mesclagem automatica de edicoes de dois dispositivos.

Pendencias fora da janela do mesmo dia ficam locais. Por autorizacao explicita
do usuario, pendencias de dias anteriores sao descartadas automaticamente na
proxima consulta/entrada, sem enviar comandos antigos e sem alterar o banco.
O ultimo estado confirmado local e preservado; alteracoes locais nao enviadas
podem ser perdidas. O topo informa o descarte. O colaborador deve retornar ao
Wi-Fi e sincronizar no mesmo dia, dentro da janela 03:00 ate 20:00.
Trocar de usuario nao envia nem mostra a fila de outro usuario.
Ao fechar a pagina, a fila continua armazenada, mas nao se promete envio com
o navegador fechado. Relatorios locais com fila pendente representam a copia
local; sincronize antes de tratar esses dados como confirmados no servidor.

## Implantacao

1. Revisar e aplicar `docs/sql/2026-10-30-controle-manutencao-folha.sql` no
   ambiente confirmado, antes de ativar a nova versao. O Codex nao executou SQL.
2. Se quiser iniciar com os estados ja existentes, revisar separadamente
   `docs/sql/2026-10-30-controle-manutencao-copia-opcional.sql`, preencher
   garagem, data, usuario ADMIN e fonte C4/LEGADO. A copia nunca consulta a CI,
   altera a origem ou sobrescreve uma folha independente existente. Ela exige
   fonte nao vazia e normaliza coexistencia antiga priorizando Bloqueado.
   Sem copia ou folha independente anterior, o novo Controle comeca vazio.
3. Gerar Prisma Client, compilar e reiniciar a API; publicar o frontend.
   Nao usar migrate/db push como alternativa automatica aos scripts revisados.
4. Conferir os tres quadros e o historico. Abrir o contexto com conexao antes
   do teste offline, desligar rede, alterar um carro e reconectar para conferir
   a fila e o banco no ambiente autorizado.

Tabelas antigas e seus historicos permanecem. Consulta de data antiga sem
folha independente mostra apenas os estados de manutencao ja persistidos
naquela data, sem reconstruir a partir da CI. O runtime C4 legado mantido por
compatibilidade nao e a fonte do novo Controle; as rotas `/manutencao` e
`/manutencao/sync` usam somente o novo servico para a operacao atual.

## Validacao

Testes locais usam banco e armazenamento em memoria, sem rede: separacao
da CI, virada, folha vazia, idempotencia, conflitos, permissao, frota, data,
rollback na virada, fila FIFO, recarga, quota e isolamento por usuario.
Banco real, script SQL e teste autenticado de PWA aguardam implantacao no
ambiente autorizado. A DLL do Prisma em uso nao exige encerrar processos
operacionais; a geracao deve ser repetida no procedimento de deploy.
