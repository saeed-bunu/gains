self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data?.text() ?? '' }
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'Gains', {
    body: payload.body || 'Your workout is waiting when you are.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.tag || 'gains-gym-reminder',
    data: { url: payload.url || '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => 'focus' in client)
    if (existing) {
      existing.navigate(url)
      return existing.focus()
    }
    return self.clients.openWindow(url)
  }))
})
