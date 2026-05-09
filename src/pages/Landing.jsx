
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";


const slides = [
    "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1920&q=90",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1920&q=90",
    "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=1920&q=90",
    "https://images.unsplash.com/photo-1470116945706-e6bf5d5a53ca?w=1920&q=90",
];



export default function Landing() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-[#0D0404] text-[#FFF5E6] overflow-hidden min-h-screen font-[Jost]">
            {/* NAVBAR */}
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/20 border-b border-[#C9A84C]/10">
                <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl text-[#E8C96D] font-serif tracking-wide">
                            ❋ Vivaah
                        </h1>
                        <p className="text-[10px] tracking-[0.3em] text-[#B08D57] uppercase">
                            Sacred Bonds
                        </p>
                    </div>




                </div>
            </nav>

            {/* HERO */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === index ? "opacity-100" : "opacity-0"
                            }`}
                    >
                        <img
                            src={slide}
                            alt="slide"
                            className="w-full h-full object-cover scale-110 animate-pulse"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-[#2B0D0D]/60 to-black/70" />
                    </div>
                ))}

                <div className="relative z-10 text-center px-6 max-w-5xl">
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="uppercase tracking-[0.4em] text-[#C9A84C] text-xs md:text-sm mb-6"
                    >
                        ✦ Begin Your Forever Journey ✦
                    </motion.p>

                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="font-serif text-5xl md:text-8xl leading-tight font-light"
                    >
                        Find Your
                        <span className="block italic text-[#E8C96D]">
                            Perfect Life Partner
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2 }}
                        className="mt-8 text-[#EADBC0]/70 text-base md:text-xl max-w-2xl mx-auto leading-8"
                    >
                        Trusted matrimony platform connecting hearts through meaningful
                        relationships, verified profiles, and sacred traditions.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.4 }}
                        className="flex flex-col md:flex-row items-center justify-center gap-5 mt-12"
                    >
                        <button
                            onClick={() => navigate("/start")}
                            className="bg-[#C9A84C] text-black px-10 py-4 rounded-full uppercase tracking-[0.2em] text-sm font-semibold hover:scale-105 transition-all"
                        >
                            Get Started
                        </button>


                    </motion.div>
                </div>


            </section>





        </div>
    );
}
