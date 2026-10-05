---
name: controle-operacional
description: Utilize esta skill ao desenvolver, corrigir ou consultar regras de negócio da tela de Controle Operacional, inventário observado na implementação atual, PWA Offline e Sincronização em Segundo Plano.
---

# Skill: Controle Operacional & Vistoria Fotográfica

Utilize esta skill sempre que o usuário solicitar desenvolvimento, manutenção ou regras de negócio relacionadas a **Controle Operacional**, **Vistorias**, **Fotos de Veículos** ou **Sincronização Offline**.

## Diretrizes e Regras de Negócio

### 1. Inventário Fixo
- A lista `INVENTORY_CARS` da implementação atual contém 464 prefixos observados, com valores listados entre `1000` e `4279`.
- Essa quantidade descreve o inventário presente no código; não deve ser tratada como regra permanente da empresa nem alterada sem validação do escopo da tarefa.
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
