import { Check, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for trying out AI code reviews",
    features: [
      "Basic code analysis",
      "Up to 5 reviews/month",
      "Community support",
      "Limited AI suggestions",
    ],
    cta: "Current Plan",
    variant: "secondary" as const,
    current: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Unlock advanced AI features, higher review limits, and priority support.",
    features: [
      "Advanced code analysis",
      "Unlimited reviews",
      "Priority email support",
      "Intelligent AI suggestions",
      "CI/CD integration",
      "Detailed reporting",
    ],
    cta: "Upgrade to Pro",
    variant: "default" as const,
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Custom AI models and dedicated support for large teams.",
    features: [
      "All Pro features",
      "Dedicated account manager",
      "On-premise deployment",
      "Custom AI models",
      "Advanced security features",
      "SLA agreements",
    ],
    cta: "Contact Sales",
    variant: "outline" as const,
  },
];

export function SubscriptionPlans() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4">Choose Your Perfect Plan</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Find the right subscription tier for your code review needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`relative hover-elevate transition-all duration-200 flex flex-col ${
              plan.featured ? "border-2 border-primary shadow-lg" : ""
            }`}
            data-testid={`card-plan-${plan.name.toLowerCase()}`}
          >
            {plan.featured && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </span>
              </div>
            )}
            {plan.current && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}
            <CardHeader className="pb-8 pt-6">
              <h3 className="text-2xl font-semibold">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {plan.description}
              </p>
            </CardHeader>
            <CardContent className="flex-1">
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
              <Button
                variant={plan.variant}
                className="w-full"
                data-testid={`button-${plan.name.toLowerCase()}-plan`}
                onClick={() => console.log(`${plan.name} plan selected`)}
              >
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="mt-12">
        <CardHeader>
          <h3 className="text-2xl font-semibold">Frequently Asked Questions</h3>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">Can I switch plans at any time?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Do you offer refunds?</h4>
            <p className="text-sm text-muted-foreground">
              We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
