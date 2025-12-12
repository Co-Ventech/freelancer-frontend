import React, { useState } from "react";

const pricingPlans = [
  {
    id: 1,
    name: "Starter",
    icon: "/heart-icon.svg",
    price: 19,
    period: "/Per Month",
    description: "Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra libero et non.",
    buttonText: "Get Started For Free",
    features: [
      { text: "Lorem ipsum dolor sit amet et", included: true },
      { text: "Lorem ipsum dolor sit amet et", included: true },
      { text: "Lorem ipsum dolor sit amet et", included: true },
      { text: "Lorem ipsum dolor sit amet et", included: false },
      { text: "Lorem ipsum pellentesque sit amet et", included: false },
      { text: "Lorem ipsum pellentesque sit amet et", included: false },
      { text: "Lorem ipsum pellentesque sit amet et", included: false },
    ],
  },
  {
    id: 2,
    name: "Standard",
    icon: "/star-icon.svg",
    price: 49,
    period: "/Per Month",
    description: "Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra libero et non.",
    buttonText: "Get Started For Free",
    features: [
      { text: "Lorem ipsum dolor sit amet et", included: true },
      { text: "Lorem ipsum dolor sit amet et", included: true },
      { text: "Lorem ipsum dolor sit amet et", included: true },
      { text: "Lorem ipsum dolor sit amet et", included: true },
      { text: "Lorem ipsum dolor sit amet et", included: true },
      { text: "Lorem ipsum pellentesque sit amet et", included: false },
      { text: "Lorem ipsum pellentesque sit amet et", included: false },
    ],
  },
  {
    id: 3,
    name: "Premium",
    icon: "/crown-icon.svg",
    price: 99,
    period: "/Per Month",
    description: "Lorem Excepteur sint occaecat consectetur. Sapien feugiat donec viverra libero et non.",
    buttonText: "Get Started For Free",
    features: [
      { text: "Lorem ipsum lovin dolor sit amet et", included: true },
      { text: "Lorem ipsum lovin dolor sit amet et", included: true },
      { text: "Lorem ipsum lovin dolor sit amet et", included: true },
      { text: "Lorem ipsum lovin dolor sit amet et", included: true },
      { text: "Lorem ipsum lovin dolor sit amet et", included: true },
      { text: "Lorem ipsum lovin dolor sit amet et", included: true },
      { text: "Lorem ipsum lovin dolor sit amet et", included: true },
    ],
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary-blue mb-4">
            Pricing
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra libero et non. Fames odio nunc quisque amet ac adipiscing.
          </p>

          {/* Toggle Switch */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
            >
              <span
                className={`${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            <span className="ml-2 inline-block bg-blue-100 text-primary-blue text-xs font-semibold px-2 py-1 rounded-xl">
              Save 20%
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} isYearly={isYearly} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ plan, isYearly }) {
  const displayPrice = isYearly ? Math.floor(plan.price * 12 * 0.8) : plan.price;
  const displayPeriod = isYearly ? "/Per Year" : plan.period;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300  border-t-4 border-primary-blue">
      <div className="flex justify-between">
            <div className="flex justify-center mb-4">
                <div className="">
                <img src={plan.icon} alt={plan.name} className="w-16 h-16" />
                </div>
            </div>

            {/* Price */}
            <div className="text-center mt-1 mb-6">
                <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-primary-blue">${displayPrice}</span>
                <span className="text-gray-500 text-sm">{displayPeriod}</span>
                </div>
            </div>
      </div>
      {/* Plan Name */}
      <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
        {plan.name}
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-sm text-center mb-6">
        {plan.description}
      </p>

      {/* CTA Button */}
      <button className="w-full bg-primary-blue text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 mb-6">
        {plan.buttonText}
      </button>

      {/* Features List */}
      <ul className="space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 mt-1">
              <img
                src="/CheckBox.svg"
                alt="Included feature"
                className={`w-5 h-5 ${feature.included ? 'opacity-100' : 'opacity-30'}`}
              />
            </span>
            <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
