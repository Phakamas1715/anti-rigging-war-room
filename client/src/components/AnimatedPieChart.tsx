import { useEffect, useState } from 'react';

interface PieSlice {
  id: string;
  value: number;
  color: string;
  label: string;
}

interface AnimatedPieChartProps {
  data: PieSlice[];
  size?: number;
  delay?: number;
  duration?: number;
  centerContent?: React.ReactNode;
}

export function AnimatedPieChart({
  data,
  size = 192,
  delay = 0,
  duration = 1500,
  centerContent,
}: AnimatedPieChartProps) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    const startTime = Date.now() + delay;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }
      
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    const frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [delay, duration]);

  const renderSlices = () => {
    let currentAngle = -90; // Start from top
    
    return data.map((slice) => {
      const percent = (slice.value / total) * 100;
      const angle = (percent / 100) * 360 * animationProgress;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      if (angle === 0) return null;
      
      const radius = 40;
      const centerX = 50;
      const centerY = 50;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = ((startAngle + angle) * Math.PI) / 180;
      
      const startX = centerX + radius * Math.cos(startRad);
      const startY = centerY + radius * Math.sin(startRad);
      const endX = centerX + radius * Math.cos(endRad);
      const endY = centerY + radius * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
        'Z'
      ].join(' ');
      
      return (
        <path
          key={slice.id}
          d={pathData}
          fill={slice.color}
          className="transition-opacity duration-300 hover:opacity-80"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          }}
        />
      );
    });
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        style={{ transform: 'rotate(0deg)' }}
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="rgba(30, 41, 59, 0.5)"
        />
        {renderSlices()}
      </svg>
      {centerContent && (
        <div className="absolute inset-0 flex items-center justify-center">
          {centerContent}
        </div>
      )}
    </div>
  );
}

export default AnimatedPieChart;
