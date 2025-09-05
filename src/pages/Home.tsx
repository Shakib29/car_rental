import React from 'react';
import PromotionalBanner from '../components/PromotionalBanner';
import Hero from '../components/Hero';
import FeaturesSection from '../components/FeaturesSection';
import TestimonialsSection from '../components/TestimonialsSection';
import CTASection from '../components/CTASection';

const Home: React.FC = () => {
  return (
    <div>
      <PromotionalBanner />
      <Hero />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};

export default Home;