import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: "BKLjISVk7kxOXSjlgpSNFaviWpiYob3hxySw5bImc8wSfX52jFtzmUUMe3QDh5rNo4E4QjD8n6eKQxjoVEXBjXc" // TODO: Add your VAPID key from Firebase Console
    });
    if (currentToken) {
      console.log("FCM Token:", currentToken);
      return currentToken;
    } else {
      console.log("No registration token available. Request permission to generate one.");
    }
  } catch (err) {
    console.log("An error occurred while retrieving token. ", err);
  }
};

export const onMessageListener = (callback) =>
  onMessage(messaging, (payload) => {
    console.log("Payload received in foreground:", payload);
    if (callback) callback(payload);
  });

export default app;
