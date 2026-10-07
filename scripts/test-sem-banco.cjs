// Suite local: nao importa bootstrap, nao inicia aplicacao e recusa conexoes TCP.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const forbidden = () => { throw new Error('Conexao de rede proibida na suite sem banco.'); };
require('node:net').connect = forbidden;
require('node:net').createConnection = forbidden;
require('node:net').Socket.prototype.connect = forbidden;
require('node:tls').connect = forbidden;
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
for (const file of fs.readdirSync(path.resolve(__dirname, '../apps/api/tests')).filter(f => f.endsWith('.test.ts')).sort()) {
  require(path.resolve(__dirname, '../apps/api/tests', file));
}
