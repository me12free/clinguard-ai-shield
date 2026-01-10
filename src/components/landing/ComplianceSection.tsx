import { Shield, Globe, FileCheck, Building } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const certifications = [
  {
    icon: Shield,
    title: "HIPAA",
    subtitle: "Health Insurance Portability and Accountability Act",
    description: "Full compliance with US federal health data protection standards."
  },
  {
    icon: Globe,
    title: "Kenya DPA 2019",
    subtitle: "Data Protection Act",
    description: "Aligned with Kenya's comprehensive data protection framework."
  },
  {
    icon: FileCheck,
    title: "SOC 2 Type II",
    subtitle: "Service Organization Control",
    description: "Independently audited security controls and practices."
  },
  {
    icon: Building,
    title: "Enterprise Ready",
    subtitle: "Security & Compliance",
    description: "Built for healthcare organizations of all sizes."
  }
];

const ComplianceSection = () => {
  return (
    <section id="compliance" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Built for Global Healthcare Compliance
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              ClinGuard is designed from the ground up to meet the stringent requirements 
              of healthcare data protection regulations worldwide. Our platform ensures 
              your organization stays compliant while leveraging cutting-edge AI technology.
            </p>
            
            <ul className="space-y-4">
              {[
                "Automatic PHI identification across 18+ data types",
                "Encrypted data storage and transmission",
                "Complete audit trail for all data access",
                "Role-based access control with MFA support",
                "Regular security assessments and penetration testing"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certifications.map((cert, index) => (
              <Card 
                key={index} 
                className="border-border hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <cert.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {cert.title}
                  </h3>
                  <p className="text-sm text-primary mb-2">
                    {cert.subtitle}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {cert.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComplianceSection;
