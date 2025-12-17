import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Hero({ title, description, ctaText = "Get In Touch", ctaLink = "#" }) {
  const [imgError, setImgError] = useState(false);

  return (
    <section className="w-full py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900  leading-tight">{title}</h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg">{description}</p>
            <div className="mt-16">
              <a href="" className="inline-flex items-center justify-center px-12 py-4 font-semibold rounded-2xl transition-all duration-300 relative" style={{ background: "white", border: "3px solid transparent", borderRadius: "16px", backgroundImage: "linear-gradient(white, white), linear-gradient(90deg, #0567FA 0%, #89CFFF 50%, #6698FF 100%)", backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box", boxShadow: "0 0 22px 6px rgba(0, 119, 255, 0.45), 0 0 40px 10px rgba(0, 119, 255, 0.25)", color: "#0567FA", fontSize: "20px", fontWeight: "700" }}>Get In Touch</a>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full h-64 md:h-80 lg:h-96">
              <div className="w-full h-full rounded-xl shadow-lg flex items-center justify-center overflow-hidden bg-white">
                {!imgError ? (<img src="/hero-dashboard.svg" alt="Hero" className="w-full h-full object-cover" onError={() => setImgError(true)} />) : (<div className="text-center text-gray-500"><p className="text-lg font-semibold">Image Placeholder</p><p className="text-sm">(Add your image here later)</p></div>)}
              </div>

              <div className="absolute -top-6 -right-6 md:-top-16 md:-right-8 w-32 h-32 lg:w-44 lg:h-44  rounded-xl shadow-xl overflow-hidden bg-white border-4 border-white">
                <img src="/hero-dashboard-topside.svg" alt="Floating Card Top" className="w-full h-full object-cover" onError={(e) => (e.target.style.display = "none")} />
              </div>

              <div className="absolute -bottom-6 -left-8 md:-bottom-8 md:-left-12 w-32 h-32 md:w-32 md:h-32 rounded-xl shadow-xl overflow-hidden bg-white border-4 border-white">
                <img src="/hero-dashboard-topside.svg" alt="Floating Card Bottom" className="w-full h-full object-cover" onError={(e) => (e.target.style.display = "none")} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
