---
name: catracas-bilhetagem
description: Utilize esta skill ao desenvolver, corrigir ou consultar regras de negócio de Catracas, Auditoria de Bilhetagem, Consistência de Turnos (fnConsisteCatracaVEICULOS), Backup de Coletas e Diário de Bordo.
---

# Skill: Catracas & Auditoria de Bilhetagem Eletrônica

Utilize esta skill sempre que o usuário solicitar desenvolvimento, manutenção ou regras de negócio relacionadas a **Catracas**, **Validadores**, **Consistência de Turnos**, **Pulos de Catraca** ou **Coletas de Backup**.

## Diretrizes e Regras de Negócio

### 1. Consistência Diária de Turnos
- A consistência executa a função SQL Server `fnConsisteCatracaVEICULOS(@data, @diff)`.
- Compara a saída do primeiro turno (`SV1`) com a entrada do segundo turno (`SV2`).
- Detecta pulos de numeração de catraca (`catracaFim` vs `catracaIni`).

### 2. Atualização em Lote de Coletas de Backup
- Atualiza os campos `coletaBKPIni` e `coletaBKPFim` na tabela `Veiculos`.
- Sempre converter datas para o fuso local antes de persistir no banco SQL Server corporativo.

### 3. Permissões de Acesso
- Apenas usuários com `role: "ADMIN"` podem acessar o módulo de catracas e conciliação de bilhetagem.
