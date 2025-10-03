import { Code2, Shield, Zap } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const features = [
  {
    icon: Code2,
    title: "Intelligent Code Suggestions",
    description:
      "Modern AI-driven recommendations improve code quality, maintainability and find bugs you'd miss manually.",
  },
  {
    icon: Shield,
    title: "Automated Security Scans",
    description:
      "Identify vulnerabilities, validate security best practices, and protect your applications from threats.",
  },
  {
    icon: Zap,
    title: "Performance Optimization",
    description:
      "Get actionable insights to speed up your applications and reduce technical debt significantly.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Supercharge Your Development Workflow
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our AI-powered code review platform brings unparalleled efficiency and precision to your development process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="hover-elevate transition-all duration-200"
              data-testid={`card-feature-${index}`}
            >
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
