/* eslint-disable */
// Firebase Messaging Service Worker — 백그라운드 푸시 수신.
// SW 환경에서는 modular SDK 를 못 쓰므로 compat 스크립트를 사용.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

// build 시 vite 가 정적 파일에 env 주입을 안 하므로 하드코딩. .env.development.local 과 동기화 유지.
firebase.initializeApp({
  apiKey: 'AIzaSyAmZmbJuDeDAd_8gEQHu0NJ7w6AnSGvwQg',
  authDomain: 'moeum-55870.firebaseapp.com',
  projectId: 'moeum-55870',
  storageBucket: 'moeum-55870.firebasestorage.app',
  messagingSenderId: '732357756581',
  appId: '1:732357756581:web:5061398c62ef90f7372f4c',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const data = payload.data ?? {}
  const title = data.title ?? payload.notification?.title ?? '모음'
  const body = data.body ?? payload.notification?.body ?? ''
  self.registration.showNotification(title, {
    body,
    icon: '/moeum-favicon.svg',
    data,
  })
})
