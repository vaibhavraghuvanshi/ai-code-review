import { HeroSection } from '@/components/hero-section';
import { FeaturesSection } from '@/components/features-section';
import { PricingPreview } from '@/components/pricing-preview';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Link } from 'wouter';
import { Sparkles } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">AICodeReview</span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/auth">
                <Button variant="ghost" data-testid="button-nav-login">
                  Login
                </Button>
              </Link>
              <Link href="/auth">
                <Button data-testid="button-nav-signup">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <HeroSection />
      <FeaturesSection />
      <PricingPreview />
      <Footer />
    </div>
  );
}
