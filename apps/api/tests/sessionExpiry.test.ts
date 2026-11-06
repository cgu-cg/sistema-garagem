import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

test('login emite token valido por exatamente sete dias mesmo com antigo override de ambiente', async () => {
  const secret = 'test-only-session-key', password = 'test-only-password';
  const user = { id: 42, role: 'manutencao', garagem: 'VCM', email: 'fixture@example.invalid',
    name: 'Fixture', password: bcrypt.hashSync(password, 4), groups: [] };
  const loader = (Module as any)._load, file = require.resolve('../src/controllers/auth');
  const cached = require.cache[file]; let login: any;
  try {
    (Module as any)._load = function(request: string, parent: any, main: boolean) {
      if (parent?.filename === file && request === '../utils/prisma') return { __esModule: true, default: { user: { findUnique: async () => user } } };
      if (parent?.filename === file && request === '../config') return { jwtSecret: secret };
      return loader.call(this, request, parent, main);
    };
    delete require.cache[file]; login = require(file).login;
  } finally { (Module as any)._load = loader; if (cached) require.cache[file] = cached; else delete require.cache[file]; }
  const previous = process.env.JWT_EXPIRES_IN;
  try {
    process.env.JWT_EXPIRES_IN = '365d';
    const res: any = { code: 200, body: null, status(code: number) { this.code = code; return this; }, json(body: any) { this.body = body; return this; } };
    await login({ body: { email: user.email, password } }, res);
    assert.equal(res.code, 200);
    const claims = jwt.verify(res.body.token, secret) as jwt.JwtPayload;
    assert.equal(claims.exp! - claims.iat!, 7 * 24 * 60 * 60);
    assert.equal(claims.id, user.id);
    assert.throws(() => jwt.verify(res.body.token, secret, { clockTimestamp: claims.exp }), /expired/);
    await login({ body: { email: user.email, password: 'wrong-test-password' } }, res);
    assert.equal(res.code, 401); assert.equal(res.body.token, undefined);
  } finally { if (previous === undefined) delete process.env.JWT_EXPIRES_IN; else process.env.JWT_EXPIRES_IN = previous; }
});
