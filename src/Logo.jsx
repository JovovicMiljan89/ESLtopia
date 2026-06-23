const ASSETS = {
  full: { src: "/brand/logo-full.png", ratio: 565 / 528 },
  icon: { src: "/brand/logo-mark.png", ratio: 411 / 371 },
};

export default function Logo({ variant = "full", size = 44, className, alt = "ESLtopia" }) {
  const { src, ratio } = ASSETS[variant];
  return (
    <img
      src={src}
      alt={alt}
      height={size}
      width={Math.round(size * ratio)}
      className={className}
      style={{ height: size, width: "auto", display: "block" }}
    />
  );
}
