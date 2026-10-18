import type { ImgHTMLAttributes } from "react";

type SafeVioLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt" | "src"> & {
  variant?: "horizontal" | "icon";
};

export function SafeVioLogo({ variant = "horizontal", ...props }: SafeVioLogoProps) {
  const isHorizontal = variant === "horizontal";

  return (
    <img
      src={isHorizontal ? "/safevio-logo.svg" : "/safevio-icon.svg"}
      alt={isHorizontal ? "SafeVio — AI Vision for a Safer Tomorrow" : "SafeVio"}
      {...props}
    />
  );
}
