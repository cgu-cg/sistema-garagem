---
name: controle-operacional
description: Utilize esta skill ao desenvolver, corrigir ou consultar regras de negócio da tela de Controle Operacional, Vistoria Fotográfica dos 464 Veículos, PWA Offline e Sincronização em Segundo Plano.
---

# Skill: Controle Operacional & Vistoria Fotográfica

Utilize esta skill sempre que o usuário solicitar desenvolvimento, manutenção ou regras de negócio relacionadas a **Controle Operacional**, **Vistorias**, **Fotos de Veículos** ou **Sincronização Offline**.

## Diretrizes e Regras de Negócio

### 1. Inventário Fixo
- O sistema gerencia 464 prefixos fixos (`INVENTORY_CARS` de `1000` a `4279`).
- O status de vistoria é verificado comparando os registros da tabela `controleOperacional` com os prefixos da frota.

### 2. Fotos e Mídia
- Cada vistoria exige até 3 fotos (Frente, Lateral e Traseira).
- As fotos são enviadas via base64 e salvas no disco em `uploads/controle-operacional/`.
- No banco de dados, são salvas as URLs relativas (`/api/uploads/controle-operacional/...`).

### 3. PWA & Offline
- Quando o usuário estiver sem conexão, a vistoria é gravada no IndexedDB local.
- O card do veículo recebe visual âmbar ("Pendente Sincronização").
- Ao restabelecer a conexão, o hook/serviço executa `syncPending` automaticamente.

### 4. Padrões Visuais (Dark Mode)
- Cartões concluídos utilizam fundo cinza grafite neutro (`dark:bg-[#0E1420]` / `border-slate-800`), e **NÃO** fundo verde escuro.
- O destaque verde esmeralda (`text-emerald-400` / `bg-emerald-500/10`) é aplicado apenas no ícone do ônibus e na pílula de status.
