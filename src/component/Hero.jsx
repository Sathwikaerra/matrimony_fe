// components/Hero.js

import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section
      className="min-h-screen bg-cover bg-center flex items-center justify-center px-6 relative"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1974&auto=format&fit=crop')",
      }}
    >
      <div className="absolute inset-0 bg-black/60"></div>

      <div className="relative z-10 text-center max-w-4xl">

        <h1 className="text-5xl md:text-7xl font-bold text-[#D4AF37] leading-tight mb-6">
          Find Your Perfect
          <span className="block text-[#F8F1E7]">
            Life Partner
          </span>
        </h1>

        <p className="text-[#F8F1E7] text-lg md:text-2xl leading-relaxed mb-10">
          A trusted traditional matrimony platform where
          families connect with love, values, and culture.
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-6">

          <Link
            to="/signup"
            className="bg-gradient-to-r from-[#D4AF37] to-[#C97B2B] text-[#3A0A10] px-10 py-4 rounded-full font-bold hover:scale-105 transition"
          >
            Get Started
          </Link>

          <button className="border border-[#D4AF37] text-[#D4AF37] px-10 py-4 rounded-full hover:bg-[#D4AF37] hover:text-[#3A0A10] transition">
            Explore Profiles
          </button>

        </div>
      </div>
    </section>
  );
}