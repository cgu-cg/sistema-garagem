---
name: design-system
description: >-
  Utilize esta skill obrigatoriamente ao criar ou alterar telas, páginas, cards, botões,
  tabelas, modais e layouts no front-end (apps/web). Garante a fidelidade visual ao layout padrão do CGU.
---

# Design System & Diretrizes Visuais (CGU Garagem)

Todas as páginas devem seguir rigorosamente o padrão visual baseado no layout Bento Grid Verde Floresta:

## 1. Paleta de Cores e Tokens
- **Fundo Principal (Canvas)**: `bg-[#F4F5F7]` (Dark mode: `bg-[#070A11]` ou `bg-background`).
- **Cards / Superfícies**: `bg-white border border-gray-100/80 shadow-sm rounded-2xl` (Dark mode: `bg-[#0E1420] border-slate-800/80 text-foreground`).
- **Cor Primária / Destaque**: Verde Floresta Escuro `bg-[#164E3A]` (Hover: `bg-[#113C2D]`, Texto: `text-white`). No Dark Mode: Verde Esmeralda Vibrante `text-emerald-400` / `bg-emerald-600`.
- **Cor de Apoio**: Verde Esmeralda Suave `bg-[#22C55E]` e Menta `bg-[#DCFCE7] text-[#164E3A]`.
- **Texto Principal**: `text-gray-900` (Dark mode: `text-slate-100` / `text-foreground`).
- **Texto Secundário / Muted**: `text-gray-500` (Dark mode: `text-slate-400` / `text-muted-foreground`).

## 2. Anatomia e Componentes Obrigatórios

### A. Cabeçalho de Página (`PageHeader`)
- Título em destaque `text-3xl font-bold tracking-tight text-gray-900`.
- Subtítulo explicativo logo abaixo em `text-sm text-gray-500`.
- Grupo de botões à direita:
  - Botão Primário: `<Button variant="forest">` (Pílula, fundo verde escuro com ícone `+`).
  - Botão Secundário: `<Button variant="outline">` (Pílula branca com borda fina).

### B. Cards de KPI / Métricas Operacionais
- Dispostos em grid de 4 colunas (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`).
- **Card Destaque (Primeiro KPI)**: Fundo verde floresta `bg-[#164E3A] text-white` com botão circular `↗` translúcido.
- **Demais Cards**: Fundo branco `bg-white text-gray-900` com botão circular `↗` de borda cinza.
- Estrutura interna: Título pequeno no topo, valor numérico gigante (`text-3xl font-bold`), badge de variação no rodapé.

### C. Badges de Status (Pílulas)
- Sempre utilizar formato pílula `rounded-full px-3 py-1 text-xs font-semibold`:
  - **Operando / Concluído**: `bg-emerald-50 text-emerald-700 border border-emerald-200`
  - **Em Andamento / Soltura**: `bg-amber-50 text-amber-700 border border-amber-200`
  - **CI / Retido / Erro**: `bg-rose-50 text-rose-700 border border-rose-200`

### D. Inputs e Busca
- Barra de busca global com formato pílula `rounded-full bg-white border border-gray-200 px-4 py-2 text-sm shadow-sm`.
- Incluir ícone de lupa à esquerda e atalho de teclado `⌘F` / `Ctrl+K` à direita.

### E. Sidebar e Navegação
- Fundo branco com borda lateral suave.
- Seções agrupadas com títulos em caixa alta cinza (`MENU`, `OPERAÇÃO`, `GERAL`).
- Item ativo: Ícone e texto em preto/verde com barra indicadora vertical verde à esquerda (`w-1 h-6 bg-[#164E3A] rounded-full`).
- Card inferior promocional/informativo: Fundo verde escuro com status de conexão/garagem ativa.

## 3. Checklist de Validação da Tela
- [ ] Cards utilizam `rounded-2xl` ou `rounded-3xl` com sombras suaves (`shadow-sm`).
- [ ] Botões de ação utilizam formato pílula (`rounded-full`).
- [ ] O primeiro card de KPI possui fundo verde escuro em destaque.
- [ ] Não existem cores hexadecimais aleatórias fora da paleta corporativa.
