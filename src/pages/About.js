import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ClientalSection from '../components/ClientalSection';
import AboutUs from '../components/AboutUs';
import Offerings from '../components/Offerings';
import MainLayout from '../Layouts/MainLayout';
import Features from '../components/Features';
import Pricing from '../components/Pricing';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import Reviews from '../components/Reviews';
export default function About() {
  return (
    <MainLayout>
      <Navbar />
      <Hero 
        title="Lorem ipsum dolor sit amet consectetur."
        description="Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra libero et non. Fames odio nunc quisque amet ac adipiscing. Dui commodo in viverra vulputate molestie urna ullamcorper tristique. Tellus gravida integer dui enim donec nibh."
        ctaText="Get In Touch"
        ctaLink="/contact"
      />
      
        <ClientalSection />
        <AboutUs/>
        <Offerings/>
        <Features/>
        <Pricing/>
        <Reviews/>
        <Contact/>
        <Footer/>
    </MainLayout>
  );
}
