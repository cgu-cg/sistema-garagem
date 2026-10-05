---
name: abastecimento-pista
description: Utilize esta skill ao desenvolver, corrigir ou consultar regras de negócio relacionadas a Sessões de Abastecimento por Carro, Leituras de Bombas B1 a B6, Medição de Tanques e Auditoria de Frentistas.
---

# Skill: Abastecimento de Pista & Medição de Tanques

Utilize esta skill sempre que o usuário solicitar desenvolvimento, correção ou regras de negócio relacionadas a **Abastecimento de Veículos**, **Bombas de Pista**, **Turno de Frentistas** e **Medição de Tanques**.

## Diretrizes e Regras de Negócio

### 1. Sessões de Abastecimento de Pista (`/abastecimento-carro`)
- Uma sessão (`AbastecimentoCarroSession`) é aberta por turno/garagem com as leituras iniciais dos totalizadores mecânicos das bombas (`b1Ini` a `b6Ini`).
- Durante o turno, cada abastecimento de carro (`AbastecimentoCarroItem`) registra prefixo, litros, bomba (`B.01` a `B.06`), foto comprobatória e matrícula.
- No fechamento da sessão, são registradas as leituras finais (`b1Fim` a `b6Fim`) e o sistema calcula a diferença e conciliação entre o total medido nas bombas e o total lançado nos carros.

### 2. Leitura de Tanques Estacionários (`/abastecimento`)
- Na implementação observada, registra medições dos tanques T1 e T2 e também do T3 quando aplicável (atualmente, exigido pelo código para a garagem VCM).
- Suporta captura ao vivo pela câmera e visualização em modal Lightbox de alta definição.
- A quantidade de tanques descrita aqui representa o comportamento atual do código, não uma regra permanente do domínio.

### 3. Tabelas do Banco de Dados
- `abastecimento_carro_sessions`
- `abastecimento_carro_items`
- `abastecimentos`
