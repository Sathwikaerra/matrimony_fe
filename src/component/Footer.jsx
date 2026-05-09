// components/Footer.js

export default function Footer() {
  return (
    <footer className="bg-[#3A0A10] border-t border-[#D4AF37]/20 py-10 px-6">

      <div className="max-w-7xl mx-auto text-center">

        <h2 className="text-4xl text-[#D4AF37] font-bold mb-4">
          Vivaah
        </h2>

        <p className="text-[#F8F1E7] mb-6">
          Traditional Matrimony Platform
        </p>

        <div className="flex justify-center gap-8 text-[#F8F1E7] mb-6">

          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">Privacy</a>

        </div>

        <p className="text-[#D4AF37]">
          © 2026 Vivaah Matrimony
        </p>

      </div>
    </footer>
  );
}