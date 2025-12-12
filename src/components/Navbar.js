import React from "react";
import { Link, NavLink } from "react-router-dom";

const CenterNavLink = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `text-sm px-4 py-2 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-primary-600 text-white shadow"
          : "text-gray-700 hover:text-primary-600"
      }`
    }
  >
    {children}
  </NavLink>
);

export default function Navbar() {
  return (
    <nav className="w-full mt-5">
      <div className="w-full mx-auto px-6 lg:px-16">
        <div className="flex items-center justify-between py-4">

          {/* LEFT: LOGO */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/bidz-logo.svg"
                alt="BidZ"
                className="h-8 md:h-10 object-contain"
              />
            </Link>
          </div>

          {/* CENTER: NAV LINKS */}
          <div className="hidden md:flex items-center justify-center gap-2">
            <CenterNavLink to="/">Home</CenterNavLink>
            <CenterNavLink to="/about">About</CenterNavLink>
            <CenterNavLink to="/offerings">Offerings</CenterNavLink>
            <CenterNavLink to="/features">Features</CenterNavLink>
            <CenterNavLink to="/pricing">Pricing</CenterNavLink>
            <CenterNavLink to="/reviews">Reviews</CenterNavLink>
            <CenterNavLink to="/contact">Contact</CenterNavLink>
          </div>

          {/* RIGHT: LOGIN BUTTON */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="hidden sm:inline-block bg-gradient-to-r from-primary-blue to-primary-500 text-white px-14 py-2 rounded-lg text-sm shadow-md hover:opacity-95 transition-opacity"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="inline-block sm:hidden text-sm text-gray-700 px-3 py-2"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
