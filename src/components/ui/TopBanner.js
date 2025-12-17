import React, { useState } from 'react';

const TopBanner = ({
  message = 'Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra libero et non',
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative w-full flex items-center justify-center px-4 bg-primary-blue text-white font-medium h-[50px] text-sm md:text-base">
      <p className="m-0 text-center">
        {message}
      </p>
      <button
        type="button"
        aria-label="Dismiss banner"
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-white/95 bg-transparent rounded-md cursor-pointer hover:bg-white/10 transition-colors focus:outline-2 focus:outline-white/20 focus:outline-offset-2"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};

export default TopBanner;
