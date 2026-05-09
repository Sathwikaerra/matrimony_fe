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
import Layout from "./component/Layout";
import Landing from "./pages/Landing";

import socket from "./services/socket";
import { initNotifications } from "./services/notificationService";

function AuthGate() {
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

    // Connect and register
    socket.connect();
    socket.emit("registerUser", userId);

    // Initialize push notifications
    initNotifications(userId);

    // Global Listeners
    socket.on("receiveMessage", (data) => {
      // Don't show toast if already on messages page with that user
      if (!window.location.pathname.startsWith("/messages")) {
        toast.success(`New message from ${data.senderName || "someone"}`, {
          icon: "💬",
          position: "top-right",
          duration: 4000,
          style: {
            background: "#1F0A0A",
            color: "#FFF5E6",
            border: "1px solid #C9A84C33",
          },
        });
      }
    });

    socket.on("notificationReceived", (data) => {
      // This handles "likes", "interests", etc.
      toast.success(data.message || "New notification", {
        icon: data.type === "like" ? "❤️" : "✨",
        position: "top-right",
        duration: 5000,
        style: {
          background: "#1F0A0A",
          color: "#FFF5E6",
          border: "1px solid #C9A84C33",
        },
      });
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("notificationReceived");
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