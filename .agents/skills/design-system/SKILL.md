---
name: design-system
description: >-
  Utilize esta skill ao criar ou alterar telas, páginas, cards, botões,
  tabelas, modais e layouts no front-end (apps/web), preservando os padrões visuais
  existentes e aplicando orientações conforme pertinentes à tarefa.
---

# Design System & Diretrizes Visuais (CGU Garagem)

Preserve os tokens, componentes e padrões visuais existentes do sistema. Use o layout Bento Grid Verde Floresta como referência quando pertinente à tela, sem impor elementos que não façam parte da tarefa.

## 1. Paleta de Cores e Tokens
- **Fundo Principal (Canvas)**: `bg-[#F4F5F7]` (Dark mode: `bg-[#070A11]` ou `bg-background`).
- **Cards / Superfícies**: `bg-white border border-gray-100/80 shadow-sm rounded-2xl` (Dark mode: `bg-[#0E1420] border-slate-800/80 text-foreground`).
- **Cor Primária / Destaque**: Verde Floresta Escuro `bg-[#164E3A]` (Hover: `bg-[#113C2D]`, Texto: `text-white`). No Dark Mode: Verde Esmeralda Vibrante `text-emerald-400` / `bg-emerald-600`.
- **Cor de Apoio**: Verde Esmeralda Suave `bg-[#22C55E]` e Menta `bg-[#DCFCE7] text-[#164E3A]`.
- **Texto Principal**: `text-gray-900` (Dark mode: `text-slate-100` / `text-foreground`).
- **Texto Secundário / Muted**: `text-gray-500` (Dark mode: `text-slate-400` / `text-muted-foreground`).

## 2. Elementos visuais quando pertinentes

Os padrões abaixo são referências para os elementos aplicáveis; não é necessário adicionar componentes ausentes nem reorganizar uma tela apenas para corresponder a esta lista.

### A. Cabeçalho de Página (`PageHeader`), quando utilizado
- Título em destaque `text-3xl font-bold tracking-tight text-gray-900`.
- Subtítulo explicativo logo abaixo em `text-sm text-gray-500`.
- Grupo de ações à direita, se a tela precisar:
  - Botão Primário: `<Button variant="forest">` (Pílula, fundo verde escuro com ícone `+`).
  - Botão Secundário: `<Button variant="outline">` (Pílula branca com borda fina).

### B. Cards de KPI / Métricas Operacionais, quando úteis
- Escolha o número de colunas conforme conteúdo e responsividade; o grid de quatro colunas é apenas uma opção.
- Use destaque e hierarquia visual de forma coerente com a tela; não é obrigatório que exista um primeiro KPI destacado ou botão decorativo.

### C. Badges de Status, quando houver status para representar
- O formato pílula `rounded-full px-3 py-1 text-xs font-semibold` e as cores abaixo são referências:
  - **Operando / Concluído**: `bg-emerald-50 text-emerald-700 border border-emerald-200`
  - **Em Andamento / Soltura**: `bg-amber-50 text-amber-700 border border-amber-200`
  - **CI / Retido / Erro**: `bg-rose-50 text-rose-700 border border-rose-200`

### D. Inputs, busca e filtros, quando necessários
- Reutilize os padrões de busca e filtro existentes; ícones, atalhos e formato pílula são aplicáveis somente quando fizerem sentido para a interação.
- Não adicione busca global nem filtros que não sejam necessários à tarefa.

### E. Sidebar e Navegação, ao alterar essa área
- Fundo branco com borda lateral suave.
- Seções agrupadas com títulos em caixa alta cinza (`MENU`, `OPERAÇÃO`, `GERAL`).
- Item ativo: Ícone e texto em preto/verde com barra indicadora vertical verde à esquerda (`w-1 h-6 bg-[#164E3A] rounded-full`).
- Card inferior promocional/informativo: Fundo verde escuro com status de conexão/garagem ativa.

## 3. Validação visual

Use somente os itens do checklist que se aplicam à tela ou ao componente alterado:
- [ ] Cards existentes mantêm cantos e sombras coerentes com o padrão da aplicação.
- [ ] Botões de ação existentes mantêm o padrão visual dos componentes compartilhados.
- [ ] Cores novas, quando necessárias, são coerentes com a paleta existente.
