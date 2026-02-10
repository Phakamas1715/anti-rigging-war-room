import React from 'react';
import { trpc } from '@/lib/trpc';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Custom hook with optimistic updates
 */
export function useOptimisticVolunteerSubmit() {
  const queryClient = useQueryClient();
  
  return trpc.volunteer.submit.useMutation({
    // Optimistic update
    onMutate: async (newSubmission) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['volunteer', 'mySubmissions'] });
      
      // Snapshot previous value
      const previousSubmissions = queryClient.getQueryData(['volunteer', 'mySubmissions']);
      
      // Optimistically update
      queryClient.setQueryData(['volunteer', 'mySubmissions'], (old: any) => {
        if (!old) return [newSubmission];
        return [...old, { 
          ...newSubmission, 
          id: Date.now(), // temporary ID
          submittedAt: new Date(),
          status: 'pending'
        }];
      });
      
      // Show optimistic toast
      toast.info('กำลังส่งข้อมูล...', { id: 'submit-volunteer' });
      
      return { previousSubmissions };
    },
    
    // On error, rollback
    onError: (err, newSubmission, context) => {
      queryClient.setQueryData(
        ['volunteer', 'mySubmissions'],
        context?.previousSubmissions
      );
      toast.error('ส่งข้อมูลไม่สำเร็จ: ' + err.message, { id: 'submit-volunteer' });
    },
    
    // On success, refetch and show success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer', 'mySubmissions'] });
      toast.success('ส่งข้อมูลสำเร็จ!', { id: 'submit-volunteer' });
    },
  });
}

/**
 * Prefetch helper for better UX
 */
export function usePrefetchStation(stationId: number | null) {
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    if (stationId) {
      // Prefetch will be handled by tRPC's built-in mechanisms
      // This is just a placeholder for the pattern
    }
  }, [stationId, queryClient]);
}
