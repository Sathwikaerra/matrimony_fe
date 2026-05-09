import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { login } from "../redux/authSlice";
import io from 'socket.io-client';
const socket = io(import.meta.env.VITE_API_URL);

import { initNotifications } from "../services/notificationService";

export default function Signup({ onSwitch }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields", { style: { background: '#1F0A0A', color: '#FFF5E6' } });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match", { style: { background: '#1F0A0A', color: '#FFF5E6' } });
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/signup`,
        { name: formData.fullName, email: formData.email, password: formData.password }
      );
      const { token, user } = response.data;
      const userId = user.id;
      dispatch(login({ token, userId, user }));
      await initNotifications(userId);
      socket.emit('registerUser', userId);
      toast.success("Account created successfully!", { style: { background: '#1F0A0A', color: '#FFF5E6' } });
      navigate("/home");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup Failed", { 
        style: { background: '#1F0A0A', color: '#FFF5E6' } 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0404] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <span className="text-4xl" style={{ color: "#C9A84C" }}>❋</span>
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: "#FFF5E6" }}>Create Account</h2>
          <p style={{ color: "#8B6B52" }}>Begin your sacred journey</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#8B6B52" }}>
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              placeholder="Your full name"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full bg-[#1A0A0A] border border-[#3D1515] rounded-xl px-5 py-3.5 text-white placeholder:text-[#3D1515] focus:outline-none focus:border-[#C9A84C] transition-colors"
            />
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#8B6B52" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#1A0A0A] border border-[#3D1515] rounded-xl px-5 py-3.5 text-white placeholder:text-[#3D1515] focus:outline-none focus:border-[#C9A84C] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3D1515] hover:text-[#C9A84C]"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "#8B6B52" }}>
                Confirm
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-[#1A0A0A] border border-[#3D1515] rounded-xl px-5 py-3.5 text-white placeholder:text-[#3D1515] focus:outline-none focus:border-[#C9A84C] transition-colors"
                />
              </div>
            </div>
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
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-8 text-sm" style={{ color: "#8B6B52" }}>
          Already have an account?{" "}
          <button
            onClick={onSwitch}
            className="font-bold hover:underline cursor-pointer"
            style={{ color: "#C9A84C" }}
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
}