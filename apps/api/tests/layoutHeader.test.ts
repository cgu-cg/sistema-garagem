import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

function renderLayout(expanded = false) {
  const loader = (Module as any)._load, resolver = (Module as any)._resolveFilename;
  const oldTSX = require.extensions['.tsx'];
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const layoutFile = require.resolve('../../web/src/components/layout.tsx');
  const cachedLayout = require.cache[layoutFile]; delete require.cache[layoutFile];
  let stateIndex = 0;
  try {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: true } });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'light' } });
    (Module as any)._resolveFilename = function(id: string, ...args: unknown[]) {
      return resolver.call(this, id.startsWith('@/') ? path.resolve('apps/web/src', id.slice(2)) : id, ...args);
    };
    (Module as any)._load = function(id: string, ...args: unknown[]) {
      if (id === 'react' && expanded) return { ...React, useState(initial: unknown) {
        const result = React.useState(initial); return ++stateIndex === 2 ? [false, result[1]] : result;
      } };
      if (id === '@/stores/auth') return { useAuth: () => ({ user: { role: 'ADMIN', name: 'Administrador', garagem: 'VCG' }, logout() {} }), roleLabels: { ADMIN: 'Administrador' } };
      if (id === 'react-router-dom') return { useLocation: () => ({ pathname: '/escala-carros/alterar-carro-programado' }), useNavigate: () => () => {},
        Outlet: () => React.createElement('p', null, 'Conteudo da pagina'),
        Link: ({ to, children, ...props }: any) => React.createElement('a', { ...props, href: to }, children) };
      return loader.call(this, id, ...args);
    };
    require.extensions['.tsx'] = (m: any, f: string) => m._compile(ts.transpileModule(readFileSync(f, 'utf8'), {
      fileName: f, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText, f);
    const { Layout } = require('../../web/src/components/layout');
    return renderToStaticMarkup(React.createElement(Layout));
  } finally {
    (Module as any)._load = loader; (Module as any)._resolveFilename = resolver;
    if (cachedLayout) require.cache[layoutFile] = cachedLayout; else delete require.cache[layoutFile];
    if (oldTSX) require.extensions['.tsx'] = oldTSX; else delete require.extensions['.tsx'];
    if (navigatorDescriptor) Object.defineProperty(globalThis, 'navigator', navigatorDescriptor); else delete (globalThis as any).navigator;
    if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor); else delete (globalThis as any).localStorage;
  }
}

test('header desktop mostra hamburguer antes do onibus e titulo fora da barra lateral', () => {
  const html = renderLayout();
  const header = html.match(/<header class="hidden md:flex[\s\S]*?<\/header>/)![0];
  const aside = html.match(/<aside[\s\S]*?<\/aside>/)![0];
  assert.match(header, /aria-controls="desktop-navigation" aria-expanded="false"/);
  assert.ok(header.indexOf('lucide-menu') < header.indexOf('lucide-bus'));
  assert.ok(header.indexOf('Sistema Garagem') < header.indexOf('Escala Carros - Alterar Carro Programado'));
  assert.doesNotMatch(html, /Garagem Operacional Integrada/);
  assert.doesNotMatch(aside, /Sistema Garagem|Garagem Operacional Integrada|Recolher menu lateral/);
});

test('menu continua expandido sobre conteudo abaixo do header, com navegacao e rodape preservados', () => {
  const html = renderLayout(true);
  const aside = html.match(/<aside[\s\S]*?<\/aside>/)![0];
  assert.match(aside, /id="desktop-navigation"/);
  assert.match(aside, /fixed left-0 top-16/);
  assert.match(aside, /w-64/);
  assert.match(aside, /Modo Escuro/);
  assert.match(aside, /Sair/);
  assert.match(aside, /Alterar Carro Programado/);
  assert.match(html, /<main class="[^"]*md:ml-14/);
  assert.match(html, /Conteudo da pagina/);
});

test('menu selecionado conserva branco no texto e seta sem transicao de cor', () => {
  const aside = renderLayout(true).match(/<aside[\s\S]*?<\/aside>/)![0];
  const parent = [...aside.matchAll(/<button\b[\s\S]*?<\/button>/g)].map(match => match[0]).find(button => button.includes('Escala Carros'))!;
  const child = [...aside.matchAll(/<a\b[\s\S]*?<\/a>/g)].map(match => match[0]).find(link => link.includes('Alterar Carro Programado'))!;
  for (const element of [parent, child]) {
    assert.ok(element);
    assert.match(element, /text-white hover:text-white focus:text-white active:text-white dark:text-white/);
    assert.match(element, /transition-\[background-color,box-shadow\]/);
    assert.doesNotMatch(element, /transition-all|transition-colors/);
  }
  const arrow = parent.match(/<svg[^>]*lucide-chevron-right[^>]*>/)![0];
  assert.match(arrow, /text-white/);
  assert.doesNotMatch(arrow, /text-slate-/);
});
