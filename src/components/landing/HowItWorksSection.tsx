import { FileText, Shield, Cpu, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: FileText,
    step: "01",
    title: "Input Clinical Data",
    description: "Healthcare professionals enter clinical notes or queries through our secure interface."
  },
  {
    icon: Shield,
    step: "02",
    title: "PHI Detection",
    description: "ClinGuard's AI scans for 18+ PHI identifiers using NLP and pattern recognition."
  },
  {
    icon: Cpu,
    step: "03",
    title: "Safe AI Processing",
    description: "Redacted data is safely processed by OpenAI with RAG-enhanced context."
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Secure Delivery",
    description: "AI-generated responses are delivered with PHI restored only to authorized viewers."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How ClinGuard Protects Your Data
          </h2>
          <p className="text-lg text-muted-foreground">
            A seamless four-step process that safeguards PHI without disrupting clinical workflows.
          </p>
        </div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line - Desktop */}
          <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-0.5 bg-border" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step Card */}
                <div className="flex flex-col items-center text-center">
                  {/* Icon Circle */}
                  <div className="relative z-10 w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-6 shadow-lg">
                    <step.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  
                  {/* Step Number */}
                  <span className="text-sm font-bold text-primary mb-2">
                    STEP {step.step}
                  </span>
                  
                  {/* Title */}
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
