import React, { useState } from "react";

const contactInfo = [
  {
    id: 1,
    icon: "/email-icon.svg",
    text: "Lorem ipsum dolor sit amet consectetur.",
    type: "email",
  },
  {
    id: 2,
    icon: "/phone-icon.svg",
    text: "Lorem ipsum dolor sit amet consectetur.",
    type: "phone",
  },
  {
    id: 3,
    icon: "/location-icon.svg",
    text: "Lorem ipsum dolor sit amet consectetur.",
    type: "location",
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Add your form submission logic here
  };

  return (
    <section className="py-16 px-16 mx-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-primary-blue mb-4">
                Contact
              </h2>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Lorem ipsum dolor sit amet consectetur.
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec
                viverra libero et non. Fames odio nunc quisque amet ac
                adipiscing.
              </p>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              {contactInfo.map((item) => (
                <ContactItem key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <ContactForm
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>
    </section>
  );
}

function ContactItem({ item }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0">
        <div className="  w-8 h-8">
          <img src={item.icon} alt={item.type} className="w-full h-full" />
        </div>
      </div>
      <p className="text-gray-700 text-sm mt-2">{item.text}</p>
    </div>
  );
}

function ContactForm({ formData, handleChange, handleSubmit }) {
  return (
    <div className="bg-white rounded-2xl p-8 w-full max-w-[420px] ml-auto shadow-[0_20px_70px_rgba(37,99,235,0.18)]">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="i.e. John Doe"
            required
            className="w-full px-4 py-3 border border-primary-blue rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="i.e. john@example.com"
            required
            className="w-full px-4 py-3 border border-primary-blue rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="i.e. +92 312 7885 66"
            required
            className="w-full px-4 py-3 border border-primary-blue rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Write your message here"
            rows="3"
            required
            className="w-full px-4 py-3 border border-primary-blue rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-primary-blue text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}
