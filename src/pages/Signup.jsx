// pages/Signup.jsx

import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {

  // ✅ State for form fields
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Handle Signup

  const navigate = useNavigate();

  const handleSignup = async (e) => {

    e.preventDefault();

    console.log("Signup Data:", formData);



    // Validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {

      alert("Please fill all fields");

      return;
    }



    // Password Match Check
    if (
      formData.password !==
      formData.confirmPassword
    ) {

      alert("Passwords do not match");

      return;
    }



    try {

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/signup`,
        {
          name: formData.fullName,
          email: formData.email,
          password: formData.password
        }
      );



      console.log(
        "Signup Success:",
        response.data
      );



      // Save Token
      localStorage.setItem(
        "token",
        response.data.token
      );



      alert("Signup Successful");



      // Navigate Home
      navigate("/home");

    } catch (error) {

      console.log(error);

      alert(
        error.response?.data?.message ||
        "Signup Failed"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6B0F1A] to-[#3A0A10] flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-[#F8F1E7]/10 backdrop-blur-xl border border-[#D4AF37]/30 rounded-[35px] p-10 shadow-2xl">

        <h2 className="text-5xl text-center text-[#D4AF37] font-bold mb-4">
          Create Account
        </h2>

        <p className="text-center text-[#F8F1E7] mb-10">
          Begin your beautiful journey
        </p>

        {/* ✅ Form */}
        <form onSubmit={handleSignup} className="space-y-6">

          {/* Full Name */}
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full bg-transparent border border-[#D4AF37]/40 rounded-xl px-5 py-4 text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-transparent border border-[#D4AF37]/40 rounded-xl px-5 py-4 text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full bg-transparent border border-[#D4AF37]/40 rounded-xl px-5 py-4 text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />

          {/* Confirm Password */}
          <input
            type="password"
            name="confirmPassword"
            placeholder="Re-type Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full bg-transparent border border-[#D4AF37]/40 rounded-xl px-5 py-4 text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />

          {/* Signup Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C97B2B] text-[#3A0A10] py-4 rounded-xl font-bold hover:scale-105 transition duration-300"
          >
            Signup
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-[#F8F1E7] mt-8">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#D4AF37] font-semibold hover:underline"
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}