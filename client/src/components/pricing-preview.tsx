import { Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Link } from 'wouter';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    features: [
      'Basic code analysis',
      'Up to 5 reviews/month',
      'Community support',
      'Limited AI suggestions',
    ],
    cta: 'Free Plan',
    variant: 'secondary' as const,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: [
      'Advanced code analysis',
      'Unlimited reviews',
      'Priority email support',
      'Intelligent AI suggestions',
      'CI/CD integration',
      'Detailed reporting',
    ],
    cta: 'Upgrade to Pro',
    variant: 'default' as const,
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: [
      'All Pro features',
      'Dedicated account manager',
      'On-premise deployment',
      'Custom AI models',
      'Advanced security features',
      'SLA agreements',
    ],
    cta: 'Contact Sales',
    variant: 'outline' as const,
  },
];

export function PricingPreview() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Perfect Plan</h2>
          <p className="text-muted-foreground text-lg">
            Find the right subscription tier for your code review needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative hover-elevate transition-all duration-200 ${
                plan.featured ? 'border-2 border-primary shadow-lg' : ''
              }`}
              data-testid={`card-plan-${plan.name.toLowerCase()}`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="pb-8 pt-6">
                <h3 className="text-2xl font-semibold">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-chart-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-6">
                <Link href="/subscription-plans" className="w-full">
                  <Button
                    variant={plan.variant}
                    className="w-full"
                    data-testid={`button-${plan.name.toLowerCase()}-plan`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
