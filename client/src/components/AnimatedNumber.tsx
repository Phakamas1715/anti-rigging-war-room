import { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  delay?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  formatNumber?: boolean;
}

export function AnimatedNumber({
  value,
  duration = 1500,
  decimals = 0,
  delay = 0,
  className = '',
  prefix = '',
  suffix = '',
  formatNumber = true,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const previousValueRef = useRef(0);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = value;
    
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp + delay;
      }

      const elapsed = timestamp - startTimeRef.current;
      
      if (elapsed < 0) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-expo)
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const currentValue = startValue + (endValue - startValue) * easeOutExpo;
      setDisplayValue(Number(currentValue.toFixed(decimals)));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValueRef.current = endValue;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      startTimeRef.current = null;
    };
  }, [value, duration, decimals, delay]);

  const formattedValue = formatNumber 
    ? displayValue.toLocaleString('th-TH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : displayValue.toFixed(decimals);

  return (
    <span className={className}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

export default AnimatedNumber;
