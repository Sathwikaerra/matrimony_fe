// App.js

import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Messages from "./pages/Messages";
import Connections from "./pages/Connections";
import Profile from "./pages/Profile";
import Layout from "./component/Layout";

function AuthGate() {
  const [showSignup, setShowSignup] = useState(false);
  return showSignup ? (
    <Signup onSwitch={() => setShowSignup(false)} />
  ) : (
    <Login onSwitch={() => setShowSignup(true)} />
  );
}

export default function App() {
  const { token } = useSelector((state) => state.auth);

  return (
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
            <Route path="/" element={<AuthGate />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}