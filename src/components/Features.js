import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const features = [
  {
    id: 1,
    icon: "/file-logo.svg",
    image: "/2nd-person-testimonial.svg",
    decorativeImage: "/side-dots.svg",
    title: "AI Proposal Writer",
    description:
      "Lorem ipsum dolor sit amet consectetur. Enim sed id sit dolor gravida. Et velit enim egestas pharetra habitant enim tempus. Egestas pellentesque neque metus at elit ac risus commodo hac. Odio et id molestie posuere auctor viverra pellentesque.",
    imagePosition: "left",
  },
  {
    id: 2,
    icon: "/fileSearch.svg",
    image: "/girl-testimonial.svg",
    decorativeImage: "/side-dots.svg",
    title: "Smart Auto Bidding",
    description:
      "Lorem ipsum dolor sit amet consectetur. Enim sed id sit dolor gravida. Et velit enim egestas pharetra habitant enim tempus. Egestas pellentesque neque metus at elit ac risus commodo hac. Odio et id molestie posuere auctor viverra pellentesque.",
    imagePosition: "left",
  },
  {
    id: 3,
    icon: "/soundup-icon.svg",
    image: "/1st-person-testimonial.svg",
    decorativeImage: "/side-dots.svg",
    title: "Performance Insights",
    description:
      "Lorem ipsum dolor sit amet consectetur. Enim sed id sit dolor gravida. Et velit enim egestas pharetra habitant enim tempus. Egestas pellentesque neque metus at elit ac risus commodo hac. Odio et id molestie posuere auctor viverra pellentesque.",
    imagePosition: "left",
  },
];

export default function Features() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary-blue mb-4">
            Features
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra
            libero et non. Fames odio nunc quisque amet ac adipiscing.
          </p>
        </div>

        {/* Features List with Stacking Effect */}
        <div className="relative">
          {features.map((feature, index) => (
            <FeatureCard 
              key={feature.id} 
              feature={feature} 
              index={index}
              total={features.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index, total }) {
  const cardRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "start start"]
  });

  // Calculate scale based on card position
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    [0.95 - (index * 0.05), 1]
  );

  // Calculate opacity
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [0.6, 0.8, 1]
  );

  const isLast = index === total - 1;

  return (
    <motion.div
      ref={cardRef}
      style={{
        scale,
        opacity,
        top: `${index * 20}px`,
      }}
      className={`${!isLast ? 'sticky' : 'relative'} mb-8`}
    >
      <div className="relative bg-light-blue border-2 border-primary-blue rounded-3xl p-1 lg:p-2 shadow-lg">
        {/* Top Right Decorative Image */}
        <div className="absolute right-0 z-10">
          <img
            src={feature.decorativeImage}
            alt=""
            className="w-12 h-24 lg:w-24 lg:h-28 object-contain"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center">
          {/* Image Section - Takes natural width */}
          <div className="flex-shrink-0">
            <div className="w-[420px] z-20">
              <img
                src={feature.image}
                alt={feature.title}
                className="w-full object-cover"
              />
            </div>
          </div>

          {/* Content Section - Takes remaining space */}
          <div className="flex-1 space-y-0">
            {/* Icon */}
            <div className="relative -left-9 -top-4 z-0">
              <img
                src={feature.icon}
                alt=""
                className="w-36 h-36 object-contain -z-10"
              />
            </div>

            {/* Title */}
            <h3 className="relative -top-14 text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">
              {feature.title}
            </h3>

            {/* Description */}
            <p className="relative -top-12 text-gray-600 text-base lg:text-lg leading-relaxed">
              {feature.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
