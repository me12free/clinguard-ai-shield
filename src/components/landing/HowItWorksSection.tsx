import { FileText, Shield, Cpu, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: FileText,
    step: "01",
    title: "Input Clinical Data",
    description:
      "Signed-in users enter notes or prompts in the app. Messages are sent to our API over HTTPS with authentication.",
  },
  {
    icon: Shield,
    step: "02",
    title: "PHI Detection",
    description:
      "A detection service finds likely PHI using rules (e.g. names, dates, phones, IDs, emails) plus optional NER. Results are character spans with categories.",
  },
  {
    icon: Cpu,
    step: "03",
    title: "Redaction & AI",
    description:
      "The server replaces spans with redaction tokens before anything is sent to the LLM. Optional RAG retrieves similar snippets to ground the reply; OpenAI runs on the redacted text.",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Response & Audit",
    description:
      "You receive the assistant reply and can review what was flagged. Conversations (redacted prompt summary) and audit events are stored. The model never sees the original identifiers.",
  },
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
            Detect PHI, redact on the server, then call the model. Optional retrieval adds context without exposing identifiers to the LLM.
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
