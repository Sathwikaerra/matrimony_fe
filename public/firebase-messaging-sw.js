importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVIYHEvuvGyW1hkB99-7VgxcRdG5x0qIc",
  authDomain: "matrimony-cd3e5.firebaseapp.com",
  projectId: "matrimony-cd3e5",
  storageBucket: "matrimony-cd3e5.firebasestorage.app",
  messagingSenderId: "722784995152",
  appId: "1:722784995152:web:962f13633f4a57baaa8e55",
  measurementId: "G-CG2K3H5XWQ"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/firebase-logo.png", // Path to an icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
