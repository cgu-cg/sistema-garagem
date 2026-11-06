# Instalacao do aplicativo e sessao - 06/11/2026

O manifesto mantem id, start_url e scope em / e display standalone. O novo
PNG apps/web/public/icons/icon-512.png tem 512x512 reais, com fonte vetorial
editavel icon-512.svg. Mantem o estilo do onibus existente e fundo opaco para
uso normal e maskable. O icone de 192x192 anterior foi preservado.

O componente PwaInstallPrompt fica montado na raiz para capturar a oferta do
navegador antes do login. O popup aparece somente com usuario autenticado e
oferta beforeinstallprompt disponivel; nao simula instalacao com um atalho.
O botao Instalar aciona o prompt nativo diretamente no clique. Agora nao e o
fechamento dispensam a oferta nessa sessao; novo login pode oferece-la de novo.

appinstalled, display-mode standalone ou navigator.standalone registram a
instalacao neste navegador/dispositivo. O marcador local sobrevive ao logout e
fecha o popup; aceitar o prompt, sem appinstalled, nao confirma instalacao.
Cancelamento, erro ou armazenamento privado nao bloqueiam o sistema. Nao ha
detector universal de instalacao/desinstalacao entre navegadores: o marcador
nao detecta uma desinstalacao posterior e os dados locais podem ser apagados.
Navegadores sem beforeinstallprompt nao recebem uma falsa oferta de instalacao.

O popup nao substitui HTTPS. A excecao de HTTP configurada por chrome://flags
e apenas para testes, por dispositivo. A instalacao depende da disponibilidade
da acao nativa no navegador; HTTPS com certificado confiavel continua indicado.

O service worker passa para garagem-v11 e inclui ambos os PNGs no cache inicial.
Nao limpar IndexedDB/armazenamento para atualizar: pode haver filas operacionais
pendentes. Atualizar o web no Docker para publicar manifesto, PNG, JS e sw.js.

## Tokens de acesso

Novos logins recebem JWT com expiracao fixa de 604800 segundos (7 dias).
JWT_EXPIRES_IN antigo deixa de controlar esse prazo; configuracao de secrets
e validacao de autenticacao permanecem iguais. Nao existe renovacao automatica.
Tokens ja emitidos conservam seu exp original; sair/entrar emite token novo.
Esta mudanca nao revoga tokens anteriores. Atualizar a API no Docker e efetuar
novo login para usar a validade nova. Nenhuma alteracao de SQL ou .env real.

## Verificacoes locais

Testes isolados verificam oferta antes/depois de autenticar, clique nativo unico,
cancelamento, falha, modo standalone, marcador persistido e storage bloqueado,
dimensoes de todos os PNGs do manifesto e JWT real emitido pelo controller com
prazo de sete dias/recusa apos expirar. Nao conectam a banco ou servidor real.
A instalacao WebAPK no celular e a permissao nativa dependem de teste no aparelho.
