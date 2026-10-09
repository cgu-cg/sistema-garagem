# Autorização operacional — primeira etapa

Esta etapa alinha navegação e endpoints sem mudar schema, flags de implantação,
janela operacional, certificação das fontes ou regras de disponibilidade.

## Política vigente

| Ação | Política |
| --- | --- |
| Consultar Manutenção/CI | Usuário autenticado, com garagem explícita; ADMIN pode consultar entre garagens. Preserva a consulta autenticada existente da API, agora refletida no menu. |
| Alterar CI/Manutenção C4 | ADMIN ou manutenção vinculada a VCG, apenas VCG; continuam exigidos contexto habilitado, janela, folha em preparação, versões e confirmações. |
| Alterar CI/Manutenção legada | ADMIN; restrições legadas preservadas. |
| Consultar/gravar Soltura | ADMIN, perfil soltura ou grupo com permissão explícita `/soltura` ou `/solturas`; não ADMIN exige garagem cadastrada e mesma garagem do contexto. |
| Consultar Escala | ADMIN; demais usuários com garagem e perfil soltura/COLABORADOR ou grupo explícito de Escala/Soltura. A tela de CI não carrega Escala quando não possui essa permissão. |
| Consultar tela de Escala | Mesmos perfis/grupos autorizados no GET da API, em modo somente leitura para não ADMIN. Busca e seleção de tipo permanecem disponíveis; controles de alteração e modais ficam desabilitados/ocultos. |
| Publicar/alterar Escala e administrar folha | ADMIN; versões e transação preservadas. |
| Reservas | Consulta exige ADMIN, soltura, COLABORADOR ou grupo explícito de Soltura/reservas; escrita exige acesso a Soltura. Consulta sem filtro é limitada à garagem cadastrada, e exclusão valida a garagem do registro. Permissão de Escala/Manutenção não concede acesso a reservas. |

O grupo `/soltura` passa a corresponder explicitamente à API `/solturas`.
Permissões de consulta ou grupos não concedem edição de CI nem ADMIN.
E-mail não define papel, acesso ou garagem. Valores de garagem válidos são
exatamente VCG/VCM. ADMIN pode selecionar contexto independentemente de vínculo.

As funções puras de política estão espelhadas em `operationalAccess.ts` no
frontend/API, com testes de paridade. Menu e guard de rota usam a mesma função.
A API consulta o cadastro atual nas rotas operacionais, sem confiar no papel
antigo do JWT; o token continua obrigatório. Outros módulos mantêm seu middleware.

401 indica sessão ausente/inválida; 403 indica ação/garagem não autorizada;
409 mantém impedimentos operacionais e conflitos; 503 indica impossibilidade
de verificar autorização. O cliente preserva status/código e identifica a categoria.
Autorização na interface nunca substitui validação transacional na API.

## Compatibilidade e decisões pendentes

- Usuários sem garagem, com garagem em formato diferente ou dependentes do e-mail
  precisam de revisão administrativa do cadastro. Nada é corrigido automaticamente.
- COLABORADOR sem grupo de Soltura deixa de receber uma tela de despacho que a
  API já recusava. Contas de teste não possuem exceção por endereço de e-mail.
- Consulta de Manutenção/CI continua autenticada e limitada à garagem; restringir
  essa leitura a determinados cargos exige decisão adicional, não aplicada aqui.
- VCM, legado, madrugada, CI em preparação e fontes não certificadas continuam
  sujeitos às recusas de Soltura existentes. Esta etapa não os habilita.
  A interface desabilita despacho para perfil sem acesso, outra garagem, VCM,
  fonte legada ou CI não finalizada. Isso é uma orientação preventiva: a API
  continua validando manutenção, origem e concorrência antes de gravar.
- Histórico e reservas passam a impedir acesso entre garagens de não ADMIN.
  A reserva permanece compartilhada dentro da garagem: não se criou regra de
  exclusividade por autor. Usuário autorizado de uma garagem pode excluir reserva
  criada por outro usuário da mesma garagem; ADMIN pode atuar entre garagens.
  A rota DELETE usa a ação explícita `deleteReservation`, sem analisar a URL.
  O controller sempre chama `removeReserva`, que revalida cadastro atual, permissão
  e garagem do registro e exclui por ID/garagem dentro de transação Serializable.
  Chamadas diretas ao controller/serviço também precisam passar por essa validação.
- O consumo de reserva após despacho continua sendo requisição separada.
- Não houve validação de contas reais, provisionamento ou navegação em navegador.
  Revisão de perfis/grupos e demonstração devem ocorrer em ambiente autorizado.

Testes locais usam cadastro e reservas simulados e a suíte que bloqueia TCP/TLS.
Nenhuma migração, consulta operacional, mudança de ambiente ou deploy faz parte
desta implementação.
