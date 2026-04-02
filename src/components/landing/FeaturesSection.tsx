import { 
  ShieldCheck, 
  Brain, 
  FileSearch, 
  Users, 
  ClipboardList, 
  Smartphone 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: ShieldCheck,
    title: "Real-Time PHI Detection",
    description:
      "A Python detection service finds likely PHI spans; the API replaces them with redaction tokens before any call to the language model.",
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description:
      "OpenAI chat completions (default gpt-4o-mini, configurable) run on redacted text so identifiers are not sent to the LLM.",
  },
  {
    icon: FileSearch,
    title: "RAG Clinical Knowledge",
    description:
      "Optional retrieval embeds your redacted query against a vector store and adds top matching snippets to the system prompt.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description:
      "Dashboard sections and admin actions are gated by role permissions (e.g. chat, PHI scan, org/user management).",
  },
  {
    icon: ClipboardList,
    title: "Audit & History",
    description:
      "Chat flows record redacted prompts, response summaries, and audit events for authenticated users.",
  },
  {
    icon: Smartphone,
    title: "Responsive Interface",
    description: "Access ClinGuard from any device with a modern, intuitive interface designed for healthcare workflows."
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Enterprise-Grade Security for Healthcare AI
          </h2>
          <p className="text-lg text-muted-foreground">
            Purpose-built features to protect patient privacy while unlocking the power of AI in clinical settings.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/30"
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <feature.icon className="h-6 w-6 text-accent-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
