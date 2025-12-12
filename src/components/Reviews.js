import React, { useState, useEffect } from 'react';
// background image is placed in `public/` so reference it by absolute public URL
const backgroundImage = '/background-blue-img-reviweSection.svg';

// Reviews data - you can add more reviews here
const reviewsData = [
  {
    id: 1,
    name: "inshraa-sadeqi",
    position: "Inshara Siddiqui - Technyx Systems",
    image: "/inshraa-sadeqi.svg",
    quote: "Their specialized and dedicated penetration testing team was impressive",
    positionClass: "bottom-left"
  },
  {
    id: 2,
    name: "Sarah Joseph",
    position: "Kasra Zunnaiyyer - Banking Solution Company",
    image: "/Kasra-Zunnaiyyer.svg",
    quote: "They effectively addressed our needs and were receptive to feedback throughout the engagement.",
    positionClass: "top-right"
  },
  {
    id: 3,
    name: "Michael Chen",
    position: "Yameen Malik - Seed Labs",
    image: "/Yameen-Malik.svg", 
    quote: "They were very eager to learn about our industry to improve quality of their deliverables.",
    positionClass: "bottom-left"
  },
  {
    id: 4,
    name: "Emily Wilson",
    position: "Beth Reid - Olivine, Inc",
    image: "/Beth-Reid.svg",
    quote: "Co-Ventech went above and beyond our expectations.",
    positionClass: "top-right"
  }
];

export default function Reviews() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter reviews by position
  const bottomLeftReviews = reviewsData.filter(r => r.positionClass === 'bottom-left');
  const topRightReviews = reviewsData.filter(r => r.positionClass === 'top-right');

  // Get current reviews for each position
  const currentBottomLeftIndex = currentIndex % bottomLeftReviews.length;
  const currentTopRightIndex = currentIndex % topRightReviews.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % Math.max(bottomLeftReviews.length, topRightReviews.length));
    }, 4000);

    return () => clearInterval(interval);
  }, [bottomLeftReviews.length, topRightReviews.length]);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-primary-blue mb-4">
            Reviews
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Lorem ipsum dolor sit amet consectetur. Sapien feugiat donec viverra libero et non.
          </p>
        </div>

        {/* Background Frame with Review Cards */}
        <div 
          className="relative w-full mx-auto max-w-[500px] lg:max-w-[700px] xl:max-w-[900px] 2xl:max-w-[1100px]" 
          style={{ minHeight: '500px', paddingTop: '40px', paddingBottom: '40px' }}
        >
          <div className="rounded-2xl p-6 h-[35rem] flex items-center justify-center">
            <div className="w-full h-full rounded-xl border-8 border-light-blue overflow-hidden">
              <img src={backgroundImage} alt="reviews background" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Bottom Left Review Card */}
          <div className="absolute z-20 w-[480px] 2xl:w-[650px] bottom-[15%] -left-[15%]">
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-primary-blue/75 to-primary-blue">
              <div className="relative flex items-start gap-4 rounded-2xl bg-white px-5 py-9 shadow-xl">
                <div className="flex-shrink-0 relative h-14 w-14">
                  {bottomLeftReviews.map((review, index) => (
                    <img 
                      key={review.id}
                      src={review.image} 
                      alt={review.name} 
                      className={`absolute h-14 w-14 object-cover  transition-opacity duration-500 ${
                        index === currentBottomLeftIndex ? 'opacity-100' : 'opacity-0'
                      }`} 
                      style={{ objectPosition: 'center' }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  {bottomLeftReviews.map((review, index) => (
                    <div key={review.id} className={`transition-opacity duration-500 ${
                      index === currentBottomLeftIndex ? 'opacity-100' : 'opacity-0 absolute'
                    }`}>
                      <h4 className="font-semibold text-gray-900 text-base mb-1">
                        {review.position}
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {review.quote}
                      </p>
                    </div>
                  ))}
                </div>
                <button className="flex-shrink-0 mt-1">
                  <img src="/person-message-icon.svg" alt="feedback-icon" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Top Right Review Card */}
          <div className="absolute z-20 w-[480px] top-[15%] -right-[15%] 2xl:w-[650px]">
            <div className="relative rounded-2xl p-[1.2px] bg-gradient-to-r from-primary-blue to-primary-blue/90">
              <div className="relative flex items-start gap-4 rounded-2xl bg-white px-5 py-9 shadow-xl">
                <div className="flex-shrink-0 relative h-14 w-14">
                  {topRightReviews.map((review, index) => (
                    <img 
                      key={review.id}
                      src={review.image} 
                      alt={review.name} 
                      className={`absolute h-14 w-14 object-cover transition-opacity duration-500 ${
                        index === currentTopRightIndex ? 'opacity-100' : 'opacity-0'
                      }`} 
                      style={{ objectPosition: 'center' }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  {topRightReviews.map((review, index) => (
                    <div key={review.id} className={`transition-opacity duration-500 ${
                      index === currentTopRightIndex ? 'opacity-100' : 'opacity-0 absolute'
                    }`}>
                      <h4 className="font-semibold text-gray-900 text-base mb-1">
                        {review.position}
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {review.quote}
                      </p>
                    </div>
                  ))}
                </div>
                <button className="flex-shrink-0 mt-1">
                  <img src="/person-message-icon.svg" alt="feedback-icon" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
