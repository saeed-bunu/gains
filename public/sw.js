// ==========================================
// 1. PWA INSTALL & FETCH EVENTS (Required for App install)
// ==========================================
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // This empty fetch listener tells the browser it's a valid PWA
});

// ==========================================
// 2. PUSH NOTIFICATION EVENTS (Your existing logic)
// ==========================================
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data?.text() ?? '' }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body || 'Your workout is waiting when you are.',
      icon: '/icon-192x192.png',  // Changed to PNG for Android support
      badge: '/icon-192x192.png', // Changed to PNG for Android support
      tag: payload.tag || 'gains-gym-reminder',
      data: { url: payload.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => 'focus' in client)
      if (existing) {
        existing.navigate(url)
        return existing.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})