import { Shield, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    product: [
      { label: "Features", href: "#features" },
      { label: "Security", href: "#compliance" },
      { label: "Pricing", href: "#" },
      { label: "Documentation", href: "#" },
    ],
    company: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#contact" },
    ],
    legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "HIPAA Policy", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  };

  return (
    <footer id="contact" className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-background">ClinGuard</span>
            </a>
            <p className="text-background/70 mb-6 max-w-sm">
              Empowering healthcare organizations to safely harness AI while 
              maintaining the highest standards of patient data protection.
            </p>
            <div className="space-y-3">
              <a href="mailto:contact@clinguard.com" className="flex items-center gap-3 text-background/70 hover:text-background transition-colors">
                <Mail className="h-4 w-4" />
                contact@clinguard.com
              </a>
              <a href="tel:+1234567890" className="flex items-center gap-3 text-background/70 hover:text-background transition-colors">
                <Phone className="h-4 w-4" />
                +1 (234) 567-890
              </a>
              <div className="flex items-start gap-3 text-background/70">
                <MapPin className="h-4 w-4 mt-1" />
                <span>123 Healthcare Ave,<br />Medical District, CA 90210</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-background mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-background mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-background mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-background/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/60 text-sm">
            © {new Date().getFullYear()} ClinGuard. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-background/60 text-sm">
              Trusted by 500+ healthcare organizations
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
