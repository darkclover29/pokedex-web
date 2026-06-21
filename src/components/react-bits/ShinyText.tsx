interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export function ShinyText({
  text,
  disabled = false,
  speed = 5,
  className = "",
}: ShinyTextProps) {
  return (
    <span
      className={`inline-block text-transparent bg-clip-text bg-gradient-to-r from-neutral-500 via-neutral-100 to-neutral-500 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(120deg, rgba(255, 255, 255, 0.15) 30%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0.15) 70%)",
        backgroundSize: "200% 100%",
        animation: disabled ? "none" : `shine ${speed}s linear infinite`,
      }}
    >
      {text}
    </span>
  );
}
