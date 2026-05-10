// App.js

import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster, toast } from "react-hot-toast";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Messages from "./pages/Messages";
import Connections from "./pages/Connections";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Layout from "./component/Layout";
import Landing from "./pages/Landing";

import socket from "./services/socket";
import { initNotifications } from "./services/notificationService";
import { requestForToken, onMessageListener } from "./firebase-config";



function AuthGate() {



  useEffect(() => {

    Notification.requestPermission().then((permission) => {

      if (permission === "granted") {

        requestForToken();

      }

    });

  }, []);



  const [showSignup, setShowSignup] = useState(false);
  return showSignup ? (
    <Signup onSwitch={() => setShowSignup(false)} />
  ) : (
    <Login onSwitch={() => setShowSignup(true)} />
  );
}

export default function App() {
  const { token, userId } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!userId) {
      if (socket.connected) socket.disconnect();
      return;
    }

    // ─── Named Listeners ─────────────────────────────────────────────────────
    const handleReceiveMessage = (data) => {
      // 1. In-app Toast
      if (!window.location.pathname.startsWith("/messages")) {
        toast.success(`New message from ${data.senderName || "someone"}`, {
          icon: "💬",
          position: "top-right",
          style: { background: "#1F0A0A", color: "#FFF5E6", border: "1px solid #C9A84C33" },
        });
      }

      // 2. System Notification (Native)
      if (Notification.permission === "granted") {
        new Notification(`💬 New message from ${data.senderName || "Someone"}`, {
          body: data.message,
          icon: "/favicon.svg"
        });
      }
    };

    const handleNotificationReceived = (data) => {
      // 1. In-app Toast
      toast.success(data.message || "New notification", {
        icon: data.type === "like" ? "❤️" : data.type === "comment" ? "💬" : "✨",
        position: "top-right",
        style: { background: "#1F0A0A", color: "#FFF5E6", border: "1px solid #C9A84C33" },
      });

      // 2. System Notification (Native)
      if (Notification.permission === "granted") {
        new Notification("✨ Matrimony Update", {
          body: data.message,
          icon: "/favicon.svg"
        });
      }
    };

    // ─── Socket Logic ────────────────────────────────────────────────────────
    socket.connect();

    const onConnect = () => {
      console.log("🔌 Socket connected, registering user:", userId);
      socket.emit("registerUser", userId);
    };

    socket.on("connect", onConnect);
    if (socket.connected) onConnect(); // if already connected, register immediately

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("notificationReceived", handleNotificationReceived);

    // ─── Firebase Push Logic ─────────────────────────────────────────────────
    const setupFirebase = async () => {
      try {
        await initNotifications(userId);
      } catch (err) {
        console.error("Firebase init failed:", err);
      }
    };
    setupFirebase();

    // ─── Firebase Foreground Logic ───────────────────────────────────────────
    const unsubscribeFCM = onMessageListener((payload) => {
      console.log("Foreground push notification:", payload);
      toast.success(payload.notification?.title || "New push notification", {
        icon: "🔥",
        position: "top-right",
        style: { background: "#1F0A0A", color: "#FFF5E6", border: "1px solid #C9A84C33" },
      });
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("notificationReceived", handleNotificationReceived);
      if (typeof unsubscribeFCM === 'function') unsubscribeFCM();
    };
  }, [userId]);

  return (
    <>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {token ? (
            <>
              <Route path="/home" element={<Layout><Home /></Layout>} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="/messages" element={<Layout fullScreen><Messages /></Layout>} />
              <Route path="/connections" element={<Layout><Connections /></Layout>} />
              <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Landing />} />
              <Route path="/start" element={<AuthGate />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </>
  );
}