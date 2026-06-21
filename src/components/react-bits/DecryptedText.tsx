import { useEffect, useState, useRef, useCallback } from "react";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  animateOnHover?: boolean;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

export function DecryptedText({
  text,
  speed = 30,
  delay = 0,
  className = "",
  animateOnHover = false,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(() => (animateOnHover ? text : ""));
  const [prevText, setPrevText] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (text !== prevText) {
    setPrevText(text);
    if (animateOnHover) {
      setDisplayText(text);
    }
  }

  const decrypt = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let currentIteration = 0;
    
    intervalRef.current = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < currentIteration) return text[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      if (currentIteration >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      currentIteration += 1 / 3;
    }, speed);
  }, [text, speed]);

  useEffect(() => {
    if (animateOnHover) {
      return;
    }

    const startTimeout = setTimeout(() => {
      decrypt();
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [decrypt, delay, animateOnHover]);

  const handleMouseEnter = () => {
    if (!animateOnHover) return;
    decrypt();
  };

  return (
    <span className={className} onMouseEnter={handleMouseEnter}>
      {displayText}
    </span>
  );
}
