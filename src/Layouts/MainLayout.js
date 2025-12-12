import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import TopBanner from '../components/ui/TopBanner';

export default function MainLayout({ 
  children, 
  backgroundImageUrl, 
  backgroundImageRole, 
  hideFooter = false, 
  hideTopBanner = false 
}) {
  return (
    <div 
      id="main-scroll-container" 
      className="relative flex min-h-screen flex-col bg-background-body overflow-x-hidden overflow-y-auto"
    >
      {/* Top Banner - Hidden on mobile */}
      <div className="hidden sm:block">
        {!hideTopBanner && <TopBanner />}
      </div>

      {/* Main Content */}
      <div className="container-wide relative z-10">
        <main className="flex-grow">{children}</main>
      </div>

      {/* Footer */}
      {/* {!hideFooter && (
        <Footer 
          backgroundImageUrl={backgroundImageUrl} 
          backgroundImageRole={backgroundImageRole} 
        />
      )} */}
    </div>
  );
}
