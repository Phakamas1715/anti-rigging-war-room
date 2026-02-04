import { useEffect, useState, useRef } from 'react';
import { useTour } from '@/contexts/TourContext';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay() {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTour, endTour } = useTour();
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const updatePosition = () => {
      const target = document.querySelector(currentStepData.target);
      if (target) {
        const rect = target.getBoundingClientRect();
        const padding = currentStepData.highlightPadding || 8;
        setTargetPosition({
          top: rect.top - padding + window.scrollY,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        // Calculate tooltip position
        const placement = currentStepData.placement || 'bottom';
        const tooltipWidth = 320;
        const tooltipHeight = 180;
        let tooltipTop = 0;
        let tooltipLeft = 0;

        switch (placement) {
          case 'top':
            tooltipTop = rect.top + window.scrollY - tooltipHeight - 16;
            tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'bottom':
            tooltipTop = rect.bottom + window.scrollY + 16;
            tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'left':
            tooltipTop = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
            tooltipLeft = rect.left - tooltipWidth - 16;
            break;
          case 'right':
            tooltipTop = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
            tooltipLeft = rect.right + 16;
            break;
        }

        // Keep tooltip within viewport
        tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 16));
        tooltipTop = Math.max(16, tooltipTop);

        setTooltipStyle({
          top: tooltipTop,
          left: tooltipLeft,
          width: tooltipWidth,
        });

        // Scroll target into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isActive, currentStep, currentStepData]);

  if (!isActive || !currentStepData || !targetPosition) return null;

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={targetPosition.left}
              y={targetPosition.top}
              width={targetPosition.width}
              height={targetPosition.height}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#tour-mask)"
          onClick={skipTour}
        />
      </svg>

      {/* Highlight border */}
      <div
        className="absolute border-2 border-red-500 rounded-lg pointer-events-none animate-pulse"
        style={{
          top: targetPosition.top,
          left: targetPosition.left,
          width: targetPosition.width,
          height: targetPosition.height,
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute bg-gray-900 border border-gray-700 rounded-xl shadow-2xl pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={tooltipStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-400">
              ขั้นตอน {currentStep + 1} / {steps.length}
            </span>
          </div>
          <button
            onClick={skipTour}
            className="p-1 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <h3 className="text-lg font-semibold text-white mb-2">
            {currentStepData.title}
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            {currentStepData.content}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipTour}
            className="text-gray-400 hover:text-white"
          >
            ข้าม
          </Button>
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                ก่อนหน้า
              </Button>
            )}
            <Button
              size="sm"
              onClick={isLastStep ? endTour : nextStep}
              className="gap-1 bg-red-600 hover:bg-red-700"
            >
              {isLastStep ? 'เสร็จสิ้น' : 'ถัดไป'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-red-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
