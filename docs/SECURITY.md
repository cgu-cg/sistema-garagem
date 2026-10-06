# Segurança atual

Este documento descreve os mecanismos de segurança observados no código atual e os riscos já identificáveis no estado do projeto em 2026-10-02.

## Resumo

O código atual implementa autenticação e algumas validações de autorização no backend, e a análise estática indica riscos relevantes relacionados a:

- armazenamento de sessão no cliente;
- uso amplo de CORS;
- upload de arquivos com pouca validação de tipo e conteúdo;
- dependência de mecanismos de permissão e roteamento que precisam ser revisados e documentados de forma explícita;
- integração com banco legado e arquivos de mídia sem controles mais rígidos.

## Mecanismos de autenticação existentes

### Login

O backend expõe endpoint de login em `POST /api/auth/login`.

No código do backend, a autenticação usa:

- `bcryptjs` para comparar senha em hash;
- `jsonwebtoken` para emissão de token JWT;
- `validate(loginSchema)` para validar payload de entrada.

### Sessão do usuário

O frontend usa `useAuth` em `apps/web/src/stores/auth.ts` para:

- salvar `token` em `localStorage`;
- salvar `user` em `localStorage`;
- carregar sessão em `loadUser()`;
- limpar sessão em caso de erro 401/403.

A autenticação do usuário está conectada ao login e ao endpoint `/api/auth/me`.

## Mecanismos de autorização existentes

### Backend

A API observada no código usa middleware de autenticação e autorização nas rotas, conforme `apps/api/src/routes/index.ts`.

Exemplos reais:

- `router.get("/users", authenticate, authorize("ADMIN"), ...)`
- `router.get("/abastecimentos", authenticate, authorize("ADMIN", "tanque", "abastecimento"), ...)`
- `router.post("/controle-operacional", authenticate, authorize("ADMIN", "operacional"), ...)`

Isso mostra que o backend participa do controle de acesso às rotas e que a proteção não depende unicamente do frontend. No entanto, a análise estática não garante que todas as rotas estejam protegidas em todos os cenários.

### Frontend

O frontend também implementa restrições de navegação em `apps/web/src/app/App.tsx` e usa `PermissionRoute` para decidir se o usuário pode acessar determinadas páginas.

Esse controle é útil para UX, mas não substitui autorização no backend.

## Regras e papéis observados

Há suporte a papéis como:

- `ADMIN`
- `COLABORADOR`
- `tanque`
- `abastecimento`
- `soltura`
- `operacional`
- `manutencao`

Também há suporte a `Group` com `permissions` em JSON String.

Esse sistema é explícito no código observado e deve ser tratado como base de autorização atual do sistema, mas não substitui revisão completa do backend e da infraestrutura em execução.

## Validação de entrada

A API usa schemas Zod para validar entradas em rotas relevantes.

Exemplos observados:

- `loginSchema`
- `createUserSchema`
- `updateUserSchema`
- `createBusSchema`
- `createAbastecimentoSchema`
- `createSolturaSchema`
- `startSessionSchema`
- `finishSessionSchema`

A validação observada nas rotas do backend reduz o risco de entrada não controlada, mas não elimina a necessidade de revisão completa dos schemas, cadeias de validação e fluxos de integração.

## Segurança de arquivos e uploads

O backend expõe uma pasta de uploads em `/api/uploads` usando `express.static`.

Riscos ou preocupações já identificáveis no código analisado:

- não foi identificado no código analisado qualquer validação explícita de tipo MIME;
- não foi identificado no código analisado qualquer restrição clara de extensão ou conteúdo para imagens;
- `express.json({ limit: "50mb" })` e `express.urlencoded({ limit: "50mb" })` aceitam payload grande;
- há risco de armazenamento de arquivos indiscriminado em pasta pública do backend.

O código atual faz imagens e arquivos ficarem acessíveis via HTTP, o que exige cuidado na gestão de nomes, extensão e autorização. Isso é uma observação técnica e não uma confirmação de falha em produção.

## Riscos com tokens e sessão no cliente

O frontend persiste JWT e usuário em `localStorage` em `apps/web/src/stores/auth.ts`.

Risco ou recomendação identificada:

- `localStorage` é vulnerável a XSS;
- um token JWT armazenado em localStorage pode ser acessado por scripts maliciosos se houver uma execução arbitrária no frontend;
- isso é mais sensível do que manter o token em memória, por exemplo.

A análise estática indica que a persistência do token no cliente é uma preocupação relevante, mas não permite confirmar a ocorrência de XSS nem a extensão do risco em produção.

## CORS

No backend, o app executa:

```ts
app.use(cors());
```

Isso abre a API para requisições cruzadas sem configuração de origem restritiva no nível do backend.

Risco ou recomendação identificada:

- a configuração atual não limita claramente origens permitidas;
- em ambientes de produção, isso aumenta a superfície de ataque dependendo do ambiente de deploy e do navegador cliente.

Essa observação se baseia no código atual e não em testes de infraestrutura de produção.

## Proteção de dados e consultas SQL

O código observado indica uso de Prisma e validação de esquema em rotas, e a regra de segurança do projeto exige parametrização para queries externas.

Observações relevantes:

- o backend usa Prisma para acessar o banco principal;
- o SQL Server legado é acessado por código específico em `mssql`, e há guidance operacional em `.agents/skills/legacy-telemetry/references/dicionario-dados-legado.md`;
- a análise do repositório indica que o uso de queries externas deve ser tratado com cuidado e parametrização, mas isso não foi validado em execução para todas as integrações.

## Divergências relevantes

1. Documentação antiga menciona permissões e papéis de forma mais rígida e simplificada. O código atual usa `role` + `groups.permissions` em conjunto.
2. A documentação antiga descreve um sistema de RBAC mais “estático” do que a implementação real.
3. A documentação antiga em geral não identifica corretamente os riscos atuais de armazenamento de token no client e de uso amplo de CORS.
4. A documentação antiga ainda pode sugerir que proteção no frontend basta. O código atual demonstra que a segurança real da aplicação depende também do backend.

## Pontos que devem ser revisados em uma próxima etapa

- limitação de origens em `cors`;
- política de armazenamento de token no cliente;
- validação de uploads de imagem por tipo/conteúdo;
- revisão de permissões por grupo e por rota no backend com critérios explícitos;
- separação clara entre permissões de UI e autorização real do backend;
- gestão de acesso ao SQL Server legado.

## Limitações da evidência

- Este documento foi baseado em código estático e no comportamento visível do repositório.
- Não houve revisão de logs, infraestrutura de deploy, reverse proxy ou política de ambiente em produção.
- Não foi validado se existem middlewares adicionais, proxy reverso ou regras externas em infraestrutura que reforcem segurança além do código lido.
- Este arquivo registra riscos observáveis e não conclui que uma falha específica foi explorada em produção.

## Proteção temporal da CI — DATA-001A

**Requisito para futuras mutações:** validar no backend a folha destinatária e o escopo temporal permitido. Retirada confirmada na manutenção deve atingir somente CI em preparação; fotografias finalizadas permanecem intactas. GETs devem ser somente leitura.

Autenticação, confirmação na interface ou data futura não demonstram preparação. Finalização foi confirmada na C3; persistência e proteção continuam pendentes no [contrato de domínio](./DOMAIN.md#data-001a--contrato-operacional-da-ci).

**ATUAL/OBSERVADO:** rotas examinadas usam authenticate; não foi identificada validação backend de preparação/finalização. Restrições por data existem na interface, mas exclusões por prefixo atingem diferentes datas e GETs podem escrever. Este registro descreve lacuna/requisito, não proteção implementada ou dano comprovado em produção.


## DATA-001C3 — Requisitos confirmados, ainda não implementados

Conforme [DOMAIN.md](./DOMAIN.md#data-001c3--contrato-consolidado-do-ciclo-e-da-fotografia-ci), CI/Controle do novo fluxo são exclusivos de ADMIN. ADMIN acessa VCG e VCM; user.garagem não define autorização nem perfil/contexto obrigatório. Garagem é isolamento de dados, não novo RBAC.

Comandos devem identificar garagem, ciclo/folha e item, validar pertencimento no backend e recusar alcance em outra garagem. Não excluir globalmente por prefixo. Habilitação do fluxo é explícita; VCM não participa automaticamente do agendamento.

Validação temporal compartilhada em America/Campo_Grande: mutação somente entre 03:00 inclusive e 18:30 exclusive, com ciclo inicializado e destino EM_PREPARACAO quando envolve CI. Verificar sob a proteção transacional; requisição anterior ao limite não tem direito adquirido. Estado EM_PREPARACAO atrasado não libera comando depois de 18:30. Bloquear alterações de Controle e CI; confirmação prévia da liberação e cancelamento sem efeitos. Finalização serializa com comandos para evitar atualização parcial.

FINALIZADA é imutável operacionalmente; nenhuma reabertura implementada. Recuperação distingue origem/horários reais e não reconstrói históricos. Correção administrativa posterior e carga Excel manual exigem procedimento próprio, não autorização ampla embutida em endpoints. GETs não executam recuperação.

ATUAL/OBSERVADO: rotas CI/manutenção usam authenticate, sem exigência ADMIN/validação de janela ou folha. Controllers inferem garagem também por usuário/email e realizam operações amplas. Esses comportamentos divergem do contrato C3 e permanecem intactos. Nenhuma proteção foi implementada nesta etapa; SEC-006 permanece separada.
