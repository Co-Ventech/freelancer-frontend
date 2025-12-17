import React from "react";

const offerings = [
  {
    id: 1,
    icon: "/ai-bid-icon.svg",
    title: "1- AI Bid Generation",
    description:
      "Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra libero et non.",
  },
  {
    id: 2,
    icon: "/automatic-bidding-icon.svg",
    title: "2- Automatic Bidding",
    description:
      "Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra libero et non.",
  },
  {
    id: 3,
    icon: "/sealed-bids-icon.svg",
    title: "3- Sealed Bids",
    description:
      "Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra libero et non.",
  },
  {
    id: 4,
    icon: "/project-filters-icon.svg",
    title: "4- Project Filters",
    description:
      "Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra libero et non.",
  },
  {
    id: 5,
    icon: "/client-filters-icon.svg",
    title: "5- Client Filters",
    description:
      "Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra libero et non.",
  },
  {
    id: 6,
    icon: "/scheduled-bidding-icon.svg",
    title: "6- Scheduled Bidding",
    description:
      "Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra libero et non.",
  },
];

export default function Offerings() {
  return (
    <section className="py-16 bg-white">
      <div className=" mx-auto px-4 sm:px-6 lg:px-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary-blue mb-4">
            Offerings
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra
            libero et non. Fames odio nunc quisque amet ac adipiscing.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerings.map((offering) => (
            <OfferingCard key={offering.id} offering={offering} />
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferingCard({ offering }) {
  return (
    <div className="bg-light-blue rounded-2xl p-6 hover:shadow-lg transition-shadow duration-300 max-w-[350px] ">
      {/* Icon Container */}
      <div className=" rounded-xl w-16 h-16 flex items-center justify-center mb-6 shadow-sm">
        <img
          src={offering.icon}
          alt={offering.title}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        {offering.title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed mb-16">
        {offering.description}
      </p>
    </div>
  );
}
