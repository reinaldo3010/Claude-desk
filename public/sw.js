"use strict";
/**
 * Service worker do Claude Deck.
 *
 * Serve para UMA coisa só: se o PC desligar, o tablet ainda desenha o painel
 * (com dados velhos e o aviso de "sem contato") em vez de mostrar a tela de
 * dinossauro do navegador.
 *
 * O que NÃO fazemos aqui: cachear chamadas de API. Um painel que mostra quota
 * cacheada é pior que um painel vazio — ele mente com cara de verdade.
 */

const CACHE = "claude-deck-v1";
const SHELL = ["./", "index.html", "deck.css", "deck.js", "icon.svg", "manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // API e fluxo de eventos nunca passam pelo cache.
  if (url.pathname.startsWith("/api/")) return;
  if (e.request.method !== "GET") return;

  // Rede primeiro, cache como rede de segurança: o painel atualiza no deploy
  // e continua abrindo quando o servidor some.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
