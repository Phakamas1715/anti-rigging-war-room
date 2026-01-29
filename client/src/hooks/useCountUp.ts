import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  decimals?: number;
  delay?: number;
  onComplete?: () => void;
}

export function useCountUp({
  start = 0,
  end,
  duration = 2000,
  decimals = 0,
  delay = 0,
  onComplete,
}: UseCountUpOptions) {
  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const reset = () => {
    setCount(start);
    setIsAnimating(false);
  };

  const startAnimation = () => {
    setIsAnimating(true);
  };

  useEffect(() => {
    if (!isAnimating) return;

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
      
      // Easing function (ease-out-cubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = start + (end - start) * easeOutCubic;
      setCount(Number(currentValue.toFixed(decimals)));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
        setIsAnimating(false);
        onComplete?.();
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      startTimeRef.current = null;
    };
  }, [isAnimating, start, end, duration, decimals, delay, onComplete]);

  // Auto-start on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startAnimation();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return { count, isAnimating, reset, startAnimation };
}

export default useCountUp;
