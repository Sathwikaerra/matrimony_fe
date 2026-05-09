// components/Features.js

import {
  FaHeart,
  FaUsers,
  FaUserShield,
} from "react-icons/fa";

const features = [
  {
    title: "Verified Profiles",
    icon: <FaUserShield />,
    desc: "Trusted and genuine matrimonial profiles.",
  },
  {
    title: "Trusted Families",
    icon: <FaUsers />,
    desc: "Connect families with cultural values.",
  },
  {
    title: "Perfect Match",
    icon: <FaHeart />,
    desc: "Find meaningful lifelong relationships.",
  },
];

export default function Features() {
  return (
    <section className="bg-[#F8F1E7] py-24 px-6">

      <div className="max-w-7xl mx-auto">

        <h2 className="text-5xl text-center text-[#6B0F1A] font-bold mb-16">
          Traditional Matchmaking
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {features.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-[35px] p-10 border border-[#D4AF37]/30 shadow-2xl hover:-translate-y-2 transition"
            >
              <div className="text-5xl text-[#D4AF37] mb-6">
                {item.icon}
              </div>

              <h3 className="text-3xl text-[#6B0F1A] font-bold mb-4">
                {item.title}
              </h3>

              <p className="text-gray-700 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}