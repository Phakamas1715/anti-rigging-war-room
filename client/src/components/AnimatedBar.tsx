import { useEffect, useState } from 'react';

interface AnimatedBarProps {
  percentage: number;
  color: string;
  delay?: number;
  duration?: number;
  className?: string;
  opacity?: number;
}

export function AnimatedBar({
  percentage,
  color,
  delay = 0,
  duration = 1000,
  className = '',
  opacity = 1,
}: AnimatedBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(percentage);
    }, delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div 
      className={`h-full rounded-full ${className}`}
      style={{ 
        width: `${width}%`,
        backgroundColor: color,
        opacity,
        transition: `width ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    />
  );
}

export default AnimatedBar;
