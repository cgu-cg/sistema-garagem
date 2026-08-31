# Dicionário de Dados: Banco Legado de Telemetria e Catracas

### 📊 Tabela: `TB_TELEMETRIA_EVENTOS` (Banco Legado SQL Server)
Conexão via pool `mssql.ts`.

| Coluna Legada | Tipo | Descrição no Sistema CGU |
| :--- | :--- | :--- |
| `CD_VEICULO` | `VARCHAR(10)` | Prefixo do ônibus (ex: `2501`) |
| `DT_EVENTO` | `DATETIME` | Data e hora da leitura da catraca |
| `QT_PASSAGEIROS` | `INT` | Total acumulado de giros de catraca |
| `CD_LINHA` | `VARCHAR(10)` | Código da linha operacional |
| `FL_GARAGEM` | `CHAR(3)` | Garagem de origem (`VCG` ou `VCM`) |

### 🔒 Regra de Consulta Obrigatória
Nunca utilize `SELECT *`. Sempre utilize query parametrizada:
```ts
const request = pool.request();
request.input('garagem', sql.VarChar, garagem);
request.input('dataInicio', sql.DateTime, dataInicio);
const result = await request.query(`
  SELECT CD_VEICULO AS prefixo, DT_EVENTO AS dataEvento, QT_PASSAGEIROS AS passageiros
  FROM TB_TELEMETRIA_EVENTOS
  WHERE FL_GARAGEM = @garagem AND DT_EVENTO >= @dataInicio
`);
