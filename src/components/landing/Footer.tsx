import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

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
      <div className="container mx-auto max-w-6xl px-4 text-center lg:text-left">
        <div className="grid grid-cols-1 justify-items-center gap-12 md:grid-cols-2 lg:grid-cols-5 lg:justify-items-start lg:gap-12">
          {/* Brand Column */}
          <div className="flex w-full max-w-md flex-col items-center lg:col-span-2 lg:max-w-none lg:items-start">
            <Link
              to="/"
              className="mb-4 flex w-fit items-center justify-center gap-2 transition-opacity hover:opacity-90 lg:justify-start"
            >
              <BrandLogo className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold text-background">ClinGuard</span>
            </Link>
            <p className="mb-6 max-w-sm text-background/70">
              Empowering healthcare organizations to safely harness AI while maintaining the highest standards of
              patient data protection.
            </p>
            <div className="flex w-full flex-col items-center gap-3 lg:items-start">
              <a
                href="mailto:contact@clinguard.com"
                className="flex items-center justify-center gap-3 text-background/70 transition-colors hover:text-background lg:justify-start"
              >
                <Mail className="h-4 w-4 shrink-0" />
                contact@clinguard.com
              </a>
              <a
                href="tel:+1234567890"
                className="flex items-center justify-center gap-3 text-background/70 transition-colors hover:text-background lg:justify-start"
              >
                <Phone className="h-4 w-4 shrink-0" />
                +1 (234) 567-890
              </a>
              <div className="flex items-start justify-center gap-3 text-background/70 lg:justify-start">
                <MapPin className="mt-1 h-4 w-4 shrink-0" />
                <span className="text-left">
                  123 Healthcare Ave,
                  <br />
                  Medical District, CA 90210
                </span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div className="flex w-full max-w-xs flex-col items-center lg:max-w-none lg:items-start">
            <h4 className="mb-4 font-semibold text-background">Product</h4>
            <ul className="flex flex-col items-center gap-3 lg:items-start">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-background/70 transition-colors hover:text-background">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="flex w-full max-w-xs flex-col items-center lg:max-w-none lg:items-start">
            <h4 className="mb-4 font-semibold text-background">Company</h4>
            <ul className="flex flex-col items-center gap-3 lg:items-start">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-background/70 transition-colors hover:text-background">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="flex w-full max-w-xs flex-col items-center lg:max-w-none lg:items-start">
            <h4 className="mb-4 font-semibold text-background">Legal</h4>
            <ul className="flex flex-col items-center gap-3 lg:items-start">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-background/70 transition-colors hover:text-background">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-background/20 pt-8 text-center md:flex-row md:justify-between md:text-left">
          <p className="text-sm text-background/60">© {new Date().getFullYear()} ClinGuard. All rights reserved.</p>
          <p className="text-sm text-background/60">Trusted by 500+ healthcare organizations</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
