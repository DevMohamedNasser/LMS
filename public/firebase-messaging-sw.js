// Firebase Cloud Messaging service worker.
// The Firebase config is passed in the query string of the registration URL,
// so there is nothing to edit in this file.

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
);

const params = new URL(self.location.href).searchParams;

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

// Messages that carry a `notification` block are shown by the browser itself.
// Data-only messages are shown here.
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;

  const data = payload.data || {};

  self.registration.showNotification(data.title || "EduCore", {
    body: data.body || "",
    data,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const link =
    (event.notification.data && event.notification.data.link) || "/";

  event.waitUntil(clients.openWindow(link));
});
