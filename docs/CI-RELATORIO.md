# Relatório CI – Solicitação de Veículos

## Origem e vínculo dos dados

O relatório oficial é renderizado pelo modal de `CiManutencaoView.tsx`.
No fluxo C4, `fetchCIBloqueiosFromApi` consulta `GET /api/c4/contexto`:
controller `c4.ts`, serviço `c4Flow.ts`, função `readContext`.
O endpoint retorna as folhas da garagem para permitir navegação histórica;
não deve ser limitado à data atual apenas para corrigir o relatório.
No legado, a origem é `GET /api/ci-bloqueios`.

O vínculo C4 é `ItemFolhaCI.folhaId -> FolhaCI.id`. A restrição única
`FolhaCI(garagem, dataFolha)` permite selecionar exatamente uma folha pelos
campos `garagem` e `data` projetados pelo serviço a partir do pai.
Data do bloqueio, garagem física e consorciada não identificam a folha.
Uma folha VCG pode conter legitimamente bloqueados da consorciada VCM.
Não existe revisão numérica de CI no modelo atual: `baseC4` é um token de
concorrência para gravações. A revisão impressa no cabeçalho é do formulário.

Todas as seções usam exclusivamente os itens da garagem/data selecionadas:

| Seção | Seleção dos itens |
| --- | --- |
| Preventivas | `categoriaPlanilha=PREVENTIVA`, separada por `tipoPreventiva` |
| Mecânica | `categoriaPlanilha=OFICINA`, `setorOficina=MECANICA` |
| Elétrica | `categoriaPlanilha=OFICINA`, `setorOficina=ELETRICA` |
| Reforço com Horário | `categoriaPlanilha=REFORCO`; C4 usa `tipoPosicao` e `ordemPosicao` persistidas |
| Bloqueados | `categoriaPlanilha=BLOQUEADO` (ou categoria ausente no legado); agrupamento por consorciada |

## Correção do isolamento

O relatório filtrava somente a data, sem a garagem. Reforço reutilizava o
resolvedor do editor, incluindo rascunhos locais indexados apenas pela data,
posições extras locais e horários padrão sem item salvo.

A seleção agora está isolada em `ciReport.ts`, exclui itens liberados e não
agrega garagens na opção TODAS. Reforço usa apenas os itens da folha; não
consulta drafts/localStorage. O título adicional C4 vem da metadata da folha,
e não do editor. O legado não possui título adicional persistido, portanto
seu valor local não é usado como informação oficial. O layout foi preservado.

## Regressão e limites da validação

`apps/api/tests/ciReport.test.ts` exercita a projeção real de `readContext`
com persistência simulada em memória e a seleção usada pelo frontend:
duas folhas de datas distintas, garagens diferentes na mesma data, todas as
seções, posições extras, horários repetidos no legado e consorciada distinta.
A suíte `node scripts/test-sem-banco.cjs` bloqueia conexões TCP/TLS.

Não houve acesso a banco nem validação visual em navegador com dados reais.
A conferência visual de impressão/PDF fica para revisão em ambiente autorizado.
