import { cn } from "@/lib/utils";

const LOGO_SRC = "/logo.png";

type BrandLogoProps = React.ComponentPropsWithoutRef<"img">;

/**
 * ClinGuard product mark. Source: `public/logo.png`.
 */
export function BrandLogo({ className, alt = "ClinGuard", ...rest }: BrandLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={cn("object-contain shrink-0", className)}
      {...rest}
    />
  );
}
