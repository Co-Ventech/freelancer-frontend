import { useEffect, useState } from "react";

// Local logo item used only inside this component
export function LogoImageItems({ src, alt }) {
  return (
    <div className="mx-2 sm:mx-4 flex items-center justify-center">
      <img
        src={src}
        alt={alt}
        className="h-16 sm:h-18 w-36 sm:w-40 object-contain inline-block"
        style={{ flex: "0 0 auto" }}
      />
    </div>
  );
}

const LogoGroupsSwitcher = () => {
  const [stage, setStage] = useState("showA");

  useEffect(() => {
    // Longer transition windows allow smooth crossfade
    const timings = {
      showA: 3000,
      transitionToB: 1000, // Increased for smooth dimming effect
      showB: 3000,
      transitionToA: 1000, // Increased for smooth dimming effect
    };

    const nextStage = {
      showA: "transitionToB",
      transitionToB: "showB",
      showB: "transitionToA",
      transitionToA: "showA",
    };

    const id = setTimeout(() => setStage(nextStage[stage]), timings[stage]);
    return () => clearTimeout(id);
  }, [stage]);

  return (
    <div className="my-14 mx-auto w-full flex justify-center -z-20">
      <div className="relative w-full mx-4 sm:mx-8 lg:mx-16 gap-4 sm:gap-6 lg:gap-8 h-[180px] sm:h-[200px] lg:h-[220px]">
        {/* Group A */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
            stage === "showA" || stage === "transitionToA" ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8 lg:gap-x-12 lg:gap-y-10 w-full px-2 sm:px-4">
            <div className="flex justify-center"><LogoImageItems src="/nexus.svg" alt="Nexus" /></div>
            <div className="flex justify-center"><LogoImageItems src="/creditbook.svg" alt="CreditBook" /></div>
            <div className="flex justify-center"><LogoImageItems src="/dataworks.svg" alt="datworks" /></div>
            <div className="justify-center lg:flex hidden"><LogoImageItems src="/bykea.svg" alt="Bykea" /></div>
            <div className="justify-center lg:flex hidden"><LogoImageItems src="/neusol.svg" alt="Neusol" /></div>
            <div className="justify-center flex"><LogoImageItems src="/bayzat.svg" alt="bayzat" /></div>
            <div className="justify-center flex"><LogoImageItems src="/rawcaster.svg" alt="rawcaster" /></div>
            <div className="justify-center flex"><LogoImageItems src="/shp.svg" alt="shp" /></div>
            <div className="justify-center lg:flex hidden"><LogoImageItems src="/rewaa.svg" alt="rewaa" /></div>
            <div className="justify-center lg:flex hidden"><LogoImageItems src="/measuringU.svg" alt="measuringU" /></div>
          </div>
        </div>

        {/* Group B */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
            stage === "showB" || stage === "transitionToB" ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8 lg:gap-x-12 lg:gap-y-10 w-full px-2 sm:px-4">
            <div className="flex justify-center"><LogoImageItems src="/primechex.svg" alt="primechex" /></div>
            <div className="flex justify-center"><LogoImageItems src="/bluefin.svg" alt="bluefin" /></div>
            <div className="flex justify-center"><LogoImageItems src="/codeGen.svg" alt="codeGen" /></div>
            <div className="justify-center md:flex hidden"><LogoImageItems src="/gbi.svg" alt="GBI" /></div>
            <div className="flex justify-center"><LogoImageItems src="/tixsee.svg" alt="tixaa" /></div>
            <div className="justify-center md:flex hidden"><LogoImageItems src="/mernan.svg" alt="marnan" /></div>
            <div className="justify-center lg:flex hidden"><LogoImageItems src="/noiseLab.svg" alt="Noiselab" /></div>
            <div className="justify-center lg:flex hidden"><LogoImageItems src="/micro1.svg" alt="micro1" /></div>
            <div className="justify-center lg:flex hidden"><LogoImageItems src="/voiceWorx.ai.svg" alt="VoiceWorx" /></div>
            <div className="justify-center lg:flex hidden"><LogoImageItems src="/zoro.svg" alt="zoro" /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientalSection = () => {
  return (
    <div className="portfolio-Clientell p-4 sm:p-8 bg-[#000000]">
      <div className="text-center mt-12 2xl:mt-28 z-50 opacity-100">
        <h2 className="mb-3.5 lg:text-5xl text-white leading-tight">Trusted By Top Agencies</h2>
      </div>
      <div className="hidden md:block">
        <LogoGroupsSwitcher />
      </div>
      <div className="flex md:hidden flex-wrap justify-center items-center gap-6 mt-14 mb-20">
        <div className="flex justify-center">
          <div className="justify-center flex"><LogoImageItems src="/rawcaster.svg" alt="Rawcaster" /></div>
          <div className="flex justify-center"><LogoImageItems src="/nexus.svg" alt="Nexus" /></div>
          <div className="flex justify-center"><LogoImageItems src="/creditBook.svg" alt="CreditBook" /></div>
        </div>
      </div>
      <div className="flex md:hidden flex-wrap justify-center items-center gap-6 mt-14 mb-20">
        <div className="flex justify-center">
          <div className="justify-center flex"><LogoImageItems src="/code-gen-portfolio.svg" alt="code-gen" /></div>
          <div className="flex justify-center"><LogoImageItems src="/SHP-portfolio.svg" alt="SHP" /></div>
          <div className="flex justify-center"><LogoImageItems src="/rewaa.svg" alt="rewaa" /></div>
        </div>
      </div>
    </div>
  );
};

export default ClientalSection;
