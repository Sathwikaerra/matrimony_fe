// pages/Login.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../redux/authSlice";
import io from 'socket.io-client';
import { initNotifications } from "../services/notificationService";

const socket = io(`${import.meta.env.VITE_API_URL}`);

export default function Login({ onSwitch }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email: formData.email, password: formData.password }
      );
      const { token, user } = response.data;
      const userId = user.id;
      dispatch(login({ token, userId, user }));
      socket.emit('registerUser', userId);
      await initNotifications(userId);
      navigate("/home");
    } catch (error) {
      alert(error.response?.data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0404] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <span className="text-4xl" style={{ color: "#C9A84C" }}>❋</span>
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: "#FFF5E6" }}>Welcome Back</h2>
          <p style={{ color: "#8B6B52" }}>Continue your sacred journey</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#8B6B52" }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-[#1A0A0A] border border-[#3D1515] rounded-xl px-5 py-3.5 text-white placeholder:text-[#3D1515] focus:outline-none focus:border-[#C9A84C] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#8B6B52" }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-[#1A0A0A] border border-[#3D1515] rounded-xl px-5 py-3.5 text-white placeholder:text-[#3D1515] focus:outline-none focus:border-[#C9A84C] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-4 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg"
            style={{ 
              background: "linear-gradient(90deg, #7B1C1C, #A0341E)", 
              color: "#FFF5E6" 
            }}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-8 text-sm" style={{ color: "#8B6B52" }}>
          Don't have an account?{" "}
          <button
            onClick={onSwitch}
            className="font-bold hover:underline cursor-pointer"
            style={{ color: "#C9A84C" }}
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}