import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const IMAGES = [
  "/aboutUs-img1.svg",
  "/aboutUs-img2.svg",
  "/aboutUs-img3.svg",
];

const workProcessSteps = [
  {
    icon: "/globe.svg",
    title: "1M+",
    description:
      "Customers visit Bizboi every month to get their service done.",
  },
  {
    icon: "/face-logo.svg",
    title: "92%",
    description:
      "Satisfaction rate comes from our awesome customers.",
  },
  {
    icon: "/star-logo.svg",
    title: "4.9/5",
    description:
      "Average customer ratings we have got all over internet.",
  },
];


const workProcessArrowPositions = [
  { x1: 18, x2: 46 },
  { x1: 52, x2: 80 },
];

const workProcessSectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const workProcessStepVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.2 + index * 0.4, ease: "easeOut" },
  }),
};

const workProcessArrowVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (index = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      delay: 0.6 + index * 0.6,
      ease: "easeOut",
    },
  }),
};

const workProcessViewport = { once: true, amount: 0.3 };


export default function AboutUs() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Text */}
          <div className="mt-0">
            <p className="text-3xl font-bold text-primary-blue mb-4">About us</p>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-serif font-normal text-gray-900 leading-tight mb-6">
              Lorem ipsum dolor sit amet consectetur. Nunc et vestibulum neque arcu dictum ullamcorper fermentum consectetur.
            </h2>
            <p className="text-sm text-gray-500 max-w-3xl">
              Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra libero et non. Fames odio nunc
              quisque amet ac adipiscing.
            </p>
          </div>

          {/* Right: stacked images */}
          <RightImageFlip />
        </div>
        {/* Work Process Section - Added at the bottom */}
<motion.div
  className="mt-16  p-8"
  variants={workProcessSectionVariants}
  initial="hidden"
  whileInView="visible"
  viewport={workProcessViewport}
>
  <div className="relative">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {workProcessSteps.map((step, index) => (
        <motion.div
          key={step.title}
          className="text-center relative z-10"
          variants={workProcessStepVariants}
          custom={index}
        >
          <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-6">
            <img src={step.icon} alt={step.title} className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-2xl text-primary-blue mb-4">{step.title}</h4>
          <p className="text-grey-primary-shade-20">{step.description}</p>
        </motion.div>
      ))}
    </div>

    <motion.svg
      className="hidden md:block absolute inset-x-0 top-0 w-full h-16 pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ zIndex: 1 }}
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
    >
      <defs>
        <marker 
          id="chevron-arrow" 
          markerWidth="4.5" 
          markerHeight="4.5" 
          refX="1.7" 
          refY="4" 
          orient="auto"
          markerUnits="userSpaceOnUse"
          viewBox="0 0 3 8"
        >
          <polyline 
            points="0,0 1.9,4 0,8" 
            fill="none" 
            stroke="#1F4ECF" 
            strokeWidth="0.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>

      {workProcessArrowPositions.map((arrow, index) => (
        <motion.line
          key={`arrow-${arrow.x1}`}
          x1={arrow.x1}
          y1="10"
          x2={arrow.x2}
          y2="10"
          stroke="#1F4ECF"
          strokeWidth="0.5"
          markerEnd="url(#chevron-arrow)"
          variants={workProcessArrowVariants}
          custom={index}
          strokeLinecap="round"
        />
      ))}
    </motion.svg>
  </div>
</motion.div>
      </div>
    </section>
  );
}

function RightImageFlip() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % IMAGES.length);
    }, 2500);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full max-w-sm lg:max-w-[400px] h-72 lg:h-[500px] mx-auto">
      {IMAGES.map((src, index) => {
        // Calculate position relative to current top card
        const position = (index - currentIndex + IMAGES.length) % IMAGES.length;

        // Define positions for each layer (0=front, 1=middle, 2=back)
        const positions = [
          { x: 0, y: 0, scale: 1, opacity: 1, z: 30 },   
          { x: 40, y: 20, scale: 0.92, opacity: 0.7, z: 20 }, 
          { x: 72, y: 20, scale: 0.92, opacity: 0.5, z: 10 }, 
        ];

        const currentPosition = positions[position];

        return (
          <motion.img
            key={index}
            src={src}
            className="absolute inset-0 w-full h-full object-cover rounded-xl shadow-lg"
            initial={false}
            animate={{
              x: currentPosition.x,
              y: currentPosition.y,
              scale: currentPosition.scale,
              opacity: currentPosition.opacity,
              zIndex: currentPosition.z,
            }}
            transition={{
              duration: 1, // 1000ms as per Figma
              ease: "easeInOut", // Ease in and out as per Figma
            }}
            style={{
              transformOrigin: "center center",
            }}
          />
        );
      })}
    </div>
  );
}
