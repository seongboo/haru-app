// 하루 화면의 서비스 워커: 홈 화면 설치 조건을 채우고, 인터넷이 없을 때도
// 화면 틀이 열리게 한다. ntfy로 가는 요청(다른 주소)은 건드리지 않는다.
const CACHE = "haru-shell-v6";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  // 새 버전이 있으면 그것을 쓰고, 인터넷이 없으면 저장해 둔 것을 쓴다.
  event.respondWith(
    fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request).then((hit) => hit || caches.match("index.html")))
  );
});
