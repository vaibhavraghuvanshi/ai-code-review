import { ArrowRight, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'wouter';
import heroImage from '@assets/generated_images/Hero_section_background_image_c8fd2192.png';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground">
          Elevate Your Code Quality with <span className="text-primary">AI</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Unlock faster, more accurate, and more insightful code reviews, empowering your team to
          build better software, faster.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/auth">
            <Button size="lg" className="gap-2" data-testid="button-get-started">
              Get Started <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 backdrop-blur-sm bg-background/30"
            data-testid="button-watch-demo"
            onClick={() => console.log('Watch demo clicked')}
          >
            <Play className="h-5 w-5" /> Watch Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
