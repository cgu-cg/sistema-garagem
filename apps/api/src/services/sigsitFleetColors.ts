import sql from 'mssql';
import 'dotenv/config';

// Classifica falhas sem propagar mensagens SQL, usuarios ou dados de conexao.
export function safeSigsitFailure(error: unknown): string {
  const value = error as { code?: string; number?: number; message?: string; originalError?: { code?: string; message?: string } } | null;
  const code = value?.code || value?.originalError?.code;
  if (/certificate|certificado|self.signed/i.test(String(value?.message || '') + String(value?.originalError?.message || ''))) return 'SIGSIT_CERTIFICADO';
  if (code === 'ELOGIN' || value?.number === 18456) return 'SIGSIT_LOGIN';
  if (code === 'ETIMEOUT') return 'SIGSIT_TIMEOUT';
  if (code === 'ESOCKET' || code === 'ECONNREFUSED' || code === 'ENOTFOUND') return 'SIGSIT_REDE_PORTA';
  if (value?.number === 229) return 'SIGSIT_SEM_PERMISSAO_SELECT';
  if (value?.number === 208) return 'SIGSIT_TABELA_INEXISTENTE';
  if (value?.number === 4060) return 'SIGSIT_BANCO_INACESSIVEL';
  return 'SIGSIT_CONSULTA_FALHOU';
}

// Pool independente do Bilhetagem; nao usa sql.connect global nem fallback mock.
export async function queryFleetColors(env: NodeJS.ProcessEnv = process.env): Promise<unknown> {
  const dedicated = Boolean(env.SIGSIT_SQL_USER || env.SIGSIT_SQL_PASSWORD);
  const user = dedicated ? env.SIGSIT_SQL_USER : env.SQL_SERVER_USER;
  const password = dedicated ? env.SIGSIT_SQL_PASSWORD : env.SQL_SERVER_PASSWORD;
  const server = env.SIGSIT_SQL_HOST;
  const port = Number(env.SIGSIT_SQL_PORT || env.SQL_SERVER_PORT || '1433');
  if (!server || !user || !password || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SIGSIT_CONFIG_INVALIDA');
  const pool = new sql.ConnectionPool({ server, port, user, password, database: env.SIGSIT_SQL_DATABASE || 'SIGSITBD',
    connectionTimeout: 15000, requestTimeout: 60000,
    options: { encrypt: env.SIGSIT_SQL_ENCRYPT === 'true', trustServerCertificate: env.SIGSIT_SQL_TRUST_SERVER_CERTIFICATE === 'true', enableArithAbort: true },
  });
  try {
    await pool.connect();
    const result = await pool.request().query(`SELECT idCarro, carroceriaFAIXA FROM dbo.Frota
      WHERE ativo = 1 AND idCarro < 6000 AND idCarro NOT IN (1999,2999,3999,4999) ORDER BY idCarro`);
    return result.recordset;
  } catch (error) { throw new Error(safeSigsitFailure(error)); }
  finally { await pool.close().catch(() => undefined); }
}
