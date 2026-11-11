import { Hero } from '../sections/Hero';
import { LogoCloud } from '../sections/LogoCloud';
import { ProblemSolution } from '../sections/ProblemSolution';
import { FeatureGrid } from '../sections/FeatureGrid';
import { HowItWorks } from '../sections/HowItWorks';
import { ProductPreviews } from '../sections/ProductPreviews';
import { SecurePayments } from '../sections/SecurePayments';
import { Testimonials } from '../sections/Testimonials';
import { PricingSection } from '../sections/PricingSection';
import { FAQSection } from '../sections/FAQSection';
import { CTABanner } from '../sections/CTABanner';

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoCloud />
      <ProblemSolution />
      <FeatureGrid />
      <HowItWorks />
      <ProductPreviews />
      <SecurePayments />
      <Testimonials />
      <PricingSection />
      <FAQSection />
      <CTABanner />
    </>
  );
}

