import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTour, TourStep } from '@/contexts/TourContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TourButtonProps {
  tourId: string;
  steps: TourStep[];
  className?: string;
  showOnFirstVisit?: boolean;
}

export function TourButton({ tourId, steps, className, showOnFirstVisit = true }: TourButtonProps) {
  const { startTour, hasSeenTour, markTourAsSeen, isActive } = useTour();

  const handleStartTour = () => {
    startTour(steps);
    markTourAsSeen(tourId);
  };

  // Auto-start tour on first visit
  if (showOnFirstVisit && !hasSeenTour(tourId) && !isActive) {
    setTimeout(() => {
      startTour(steps);
      markTourAsSeen(tourId);
    }, 1000);
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleStartTour}
            className={className}
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>เริ่ม Tutorial</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
