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
    description: "Automatically identifies and redacts patient names, medical records, SSNs, and other sensitive data before processing."
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Leverages OpenAI's GPT-4 for intelligent clinical documentation while maintaining strict data privacy."
  },
  {
    icon: FileSearch,
    title: "RAG Clinical Knowledge",
    description: "Retrieval-Augmented Generation provides accurate, context-aware responses using verified medical knowledge bases."
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description: "Granular permissions ensure staff only access data appropriate to their role and responsibilities."
  },
  {
    icon: ClipboardList,
    title: "Comprehensive Audit Logs",
    description: "Complete tracking of all data access and modifications for compliance reporting and security reviews."
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
