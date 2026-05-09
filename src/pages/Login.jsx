// pages/Login.jsx

import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import io from 'socket.io-client';
import { initNotifications } from "../services/notificationService"; // ← ADDED

const socket = io(`${import.meta.env.VITE_API_URL}`);

export default function Login() {

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email: formData.email, password: formData.password }
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.user.id);

      const userId = response.data.user.id;

      socket.emit('registerUser', userId);

      // ── Enable push notifications ──────────────────────────────────
      await initNotifications(userId); // ← ADDED — browser will ask "Allow notifications?"
      // ──────────────────────────────────────────────────────────────

      navigate("/home");

    } catch (error) {
      alert(error.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6B0F1A] to-[#3A0A10] flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-[#F8F1E7]/10 backdrop-blur-xl border border-[#D4AF37]/30 rounded-[35px] p-10 shadow-2xl">

        <h2 className="text-5xl text-center text-[#D4AF37] font-bold mb-4">
          Welcome Back
        </h2>

        <p className="text-center text-[#F8F1E7] mb-10">
          Continue your beautiful journey
        </p>

        <form onSubmit={handleLogin} className="space-y-6">

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-transparent border border-[#D4AF37]/40 rounded-xl px-5 py-4 text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full bg-transparent border border-[#D4AF37]/40 rounded-xl px-5 py-4 text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C97B2B] text-[#3A0A10] py-4 rounded-xl font-bold hover:scale-105 transition duration-300"
          >
            Login
          </button>

        </form>

        <p className="text-center text-[#F8F1E7] mt-8">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-[#D4AF37] font-semibold hover:underline"
          >
            Create Account
          </Link>
        </p>

      </div>
    </div>
  );
}