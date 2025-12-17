import React, { useState } from "react";
import { Link } from "react-router-dom";

const footerData = {
  company: {
    title: "Company",
    links: [
      { name: "About us", href: "/about" },
      { name: "Contact", href: "/contact" },
      { name: "Reviews", href: "/reviews" },
      { name: "Partners", href: "/partners" },
    ],
  },
  product: {
    title: "Product",
    links: [
      { name: "Offerings", href: "/offerings" },
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
    ],
  },
  socialMedia: [
    { name: "Twitter", icon: "/twitter-icon.svg", href: "https://twitter.com" },
    { name: "Facebook", icon: "/facebook-icon.svg", href: "https://facebook.com" },
    { name: "Instagram", icon: "/instagram-icon.svg", href: "https://instagram.com" },
    { name: "LinkedIn", icon: "/linkedin-icon.svg", href: "https://linkedin.com" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    console.log("Subscribed with email:", email);
    setEmail("");
    // Add your subscription logic here
  };

  return (
    <>
      <style>{`
        .social-icon-hover {
          color: #7D818D;
          transition: color 0.2s ease;
        }
        .social-icon-hover:hover {
          color: #1F4ECF;
        }
        .social-icon-hover svg {
          width: 20px;
          height: 20px;
        }
      `}</style>
      <footer className="bg-primary-black-shade-10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Brand Section */}
          <BrandSection />
          <div className=" ml-6 flex space-x-20">
          {/* Company Links */}
          <FooterLinks data={footerData.company} />

          {/* Product Links */}
          <FooterLinks data={footerData.product} />
          </div>

          {/* Newsletter Section */}
          <NewsletterSection
            email={email}
            setEmail={setEmail}
            handleSubscribe={handleSubscribe}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-8"></div>

        {/* Bottom Section */}
        <FooterBottom socialMedia={footerData.socialMedia} legal={footerData.legal} />
      </div>
    </footer>
    </>
  );
}

function BrandSection() {
  return (
    <div className="space-y-4">
      {/* Logo Placeholder */}
      <div className="flex items-center">
        <img
          src="/bidz-footer-logo.svg"
          alt="BidZ Logo"
          className="h-24 w-auto"
        />
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
        Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra
        libero et non. Fames odio nunc quisque amet ac adipiscing.
      </p>
    </div>
  );
}

function FooterLinks({ data }) {
  return (
    <div>
      <h3 className="text-white font-semibold text-lg mb-4">{data.title}</h3>
      <ul className="space-y-3">
        {data.links.map((link, index) => (
          <li key={index}>
            <Link
              to={link.href}
              className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewsletterSection({ email, setEmail, handleSubscribe }) {
  return (
    <div>
      <h3 className="text-white font-semibold text-lg mb-2">
        Lorem Ipsum Dolor
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        Lorem ipsum dolor sit amet consectetur.
      </p>

      <form onSubmit={handleSubscribe} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="w-full px-4 py-3 bg-white text-gray-900 border-2 border-primary-blue rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all"
        />
        <button
          type="submit"
          className="w-full bg-primary-blue text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}

function FooterBottom({ socialMedia, legal }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
      {/* Social Media Icons */}
      <div className="flex gap-4">
        {socialMedia.map((social, index) => (
          <SocialIcon
            key={index}
            name={social.name}
            href={social.href}
            iconType={social.name.toLowerCase()}
          />
        ))}
      </div>
      <div className="flex flex-col items-center text-center gap-4">
      {/* Copyright */}
      <div className="text-center">
        <p className="text-gray-400 text-sm">
          ©{new Date().getFullYear()} BidZ. All Rights Reserved.
        </p>
      </div>
      {/* Legal Links */}
      <div className="flex gap-4">
        {legal.map((link, index) => (
          <Link
            key={index}
            to={link.href}
            className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
          >
            {link.name}
          </Link>
        ))}
      </div>
      </div>
      <div>      </div>
    </div>
  );
}

// Social Icon Component with inline SVG
function SocialIcon({ name, href, iconType }) {
  // Generate unique IDs for each icon instance
  const uniqueId = `icon-${iconType}-${Math.random().toString(36).substr(2, 9)}`;
  
  const iconComponents = {
    twitter: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath={`url(#clip0_${uniqueId})`}>
          <g clipPath={`url(#clip1_${uniqueId})`}>
            <mask id={`mask0_${uniqueId}`} style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="0" y="0" width="26" height="26">
              <path d="M0 0H25.4169V25.4169H0V0Z" fill="white"/>
            </mask>
            <g mask={`url(#mask0_${uniqueId})`}>
              <path d="M20.0158 1.19141H23.9137L15.399 10.9479L25.4169 24.2264H17.574L11.4267 16.1747L4.40076 24.2264H0.499261L9.60579 13.7873L0 1.19322H8.04265L13.5908 8.55143L20.0158 1.19141ZM18.6451 21.8881H20.8056L6.86258 3.40813H4.546L18.6451 21.8881Z" fill="currentColor"/>
            </g>
          </g>
        </g>
        <defs>
          <clipPath id={`clip0_${uniqueId}`}>
            <rect width="25.4169" height="25.4169" fill="white"/>
          </clipPath>
          <clipPath id={`clip1_${uniqueId}`}>
            <rect width="25.4169" height="25.4169" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    ),
    facebook: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24.4573 0H1.06349C0.476216 0 0.000137329 0.476079 0.000137329 1.06335V24.4571C0.000137329 25.0444 0.476216 25.5205 1.06349 25.5205H13.6314V15.6376H10.3056V11.7861H13.6314V8.94566C13.6314 5.64939 15.6447 3.85451 18.5852 3.85451C19.9937 3.85451 21.2043 3.95937 21.557 4.00625V7.45104L19.5177 7.45197C17.9184 7.45197 17.6088 8.21189 17.6088 9.32702V11.7861H21.4228L20.9262 15.6376H17.6088V25.5205H24.4573C25.0445 25.5205 25.5206 25.0444 25.5206 24.4571V1.06335C25.5206 0.476079 25.0445 0 24.4573 0Z" fill="currentColor"/>
      </svg>
    ),
    instagram: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M7.4993 0.0765614C8.86039 0.0148869 9.29477 0 12.7602 0C16.2257 0 16.6601 0.0148869 18.0212 0.0765614C20.0958 0.1712 21.9168 0.679483 23.3789 2.14159C24.8415 3.60423 25.3493 5.42576 25.4439 7.4993C25.5056 8.86039 25.5205 9.29477 25.5205 12.7602C25.5205 16.2257 25.5056 16.6601 25.4439 18.0212C25.3493 20.0958 24.841 21.9168 23.3789 23.3789C21.9162 24.8415 20.0942 25.3493 18.0212 25.4439C16.6601 25.5056 16.2257 25.5205 12.7602 25.5205C9.29477 25.5205 8.86039 25.5056 7.4993 25.4439C5.4247 25.3493 3.6037 24.841 2.14159 23.3789C0.678951 21.9162 0.1712 20.0947 0.0765614 18.0212C0.0148869 16.6601 0 16.2257 0 12.7602C0 9.29477 0.0148869 8.86039 0.0765614 7.4993C0.1712 5.4247 0.679483 3.6037 2.14159 2.14159C3.60423 0.678951 5.42576 0.1712 7.4993 0.0765614ZM17.9165 2.37343C16.5709 2.31175 16.1673 2.29899 12.7603 2.29899C9.35336 2.29899 8.94982 2.31228 7.60415 2.37343C6.15214 2.43989 4.80434 2.73071 3.76757 3.76748C2.7308 4.80425 2.43997 6.15205 2.37351 7.60406C2.31184 8.94973 2.29908 9.35328 2.29908 12.7603C2.29908 16.1672 2.31237 16.5708 2.37351 17.9165C2.43997 19.3685 2.7308 20.7163 3.76757 21.753C4.80434 22.7898 6.15214 23.0806 7.60415 23.1471C8.94929 23.2088 9.35283 23.2215 12.7603 23.2215C16.1679 23.2215 16.5714 23.2082 17.9165 23.1471C19.3686 23.0806 20.7164 22.7898 21.7531 21.753C22.7899 20.7163 23.0807 19.3685 23.1472 17.9165C23.2089 16.5708 23.2216 16.1672 23.2216 12.7603C23.2216 9.35328 23.2083 8.94973 23.1472 7.60406C23.0807 6.15205 22.7899 4.80425 21.7531 3.76748C20.7164 2.73071 19.3686 2.43989 17.9165 2.37343Z" fill="currentColor"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M6.96033 13.3401C6.96033 9.81662 9.81647 6.95996 13.3404 6.95996C16.8644 6.95996 19.7206 9.8161 19.7206 13.3401C19.7206 16.8641 16.8644 19.7202 13.3404 19.7202C9.81647 19.7202 6.96033 16.8635 6.96033 13.3401ZM9.19866 13.3401C9.19866 15.6273 11.0531 17.4817 13.3402 17.4817C15.6274 17.4817 17.4818 15.6273 17.4818 13.3401C17.4818 11.0529 15.6274 9.1985 13.3402 9.1985C11.0531 9.1985 9.19866 11.0529 9.19866 13.3401Z" fill="currentColor"/>
        <circle cx="19.1404" cy="6.38066" r="1.74003" fill="currentColor"/>
      </svg>
    ),
    linkedin: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M1.06335 0H24.4571C25.042 0 25.5205 0.478509 25.5205 1.06335V24.4571C25.5205 25.042 25.042 25.5205 24.4571 25.5205H1.06335C0.478509 25.5205 0 25.042 0 24.4571V1.06335C0 0.478509 0.478509 0 1.06335 0ZM3.77498 21.7455H7.54989V9.5701H3.77498V21.7455ZM5.68909 7.9222C4.46623 7.9222 3.50922 6.96518 3.50922 5.74233C3.50922 4.51947 4.46623 3.56245 5.68909 3.56245C6.91194 3.56245 7.86896 4.51947 7.86896 5.74233C7.86896 6.91201 6.91194 7.9222 5.68909 7.9222ZM17.9708 21.7455H21.6925V15.0463C21.6925 11.7499 21.0013 9.25106 17.1733 9.25106C15.3656 9.25106 14.0895 10.2612 13.611 11.2183H13.5579V9.57006H9.94246V21.7455H13.7174V15.7375C13.7174 14.1425 14.0364 12.6006 16.0036 12.6006C17.9708 12.6006 17.9708 14.4083 17.9708 15.8438V21.7455Z" fill="currentColor"/>
      </svg>
    ),
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="social-icon-hover"
      aria-label={name}
    >
      {iconComponents[iconType] || iconComponents.twitter}
    </a>
  );
}
