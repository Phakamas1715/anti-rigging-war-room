import { useState, useEffect, useCallback } from 'react';
import { 
  initDB, 
  saveOfflineSubmission, 
  getUnsyncedSubmissions, 
  syncOfflineData,
  isOnline,
  onOnlineStatusChange
} from '@/lib/offlineStorage';

export function useOffline() {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Initialize DB and check pending submissions
  useEffect(() => {
    initDB().then(() => {
      updatePendingCount();
    });
  }, []);

  // Listen for online/offline changes
  useEffect(() => {
    const unsubscribe = onOnlineStatusChange((isOnline) => {
      setOnline(isOnline);
      if (isOnline) {
        // Auto-sync when back online
        syncPendingSubmissions();
      }
    });

    return unsubscribe;
  }, []);

  const updatePendingCount = useCallback(async () => {
    try {
      const unsynced = await getUnsyncedSubmissions();
      setPendingCount(unsynced.length);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  const saveSubmission = useCallback(async (data: {
    stationId: number;
    totalVoters: number;
    validVotes: number;
    invalidVotes: number;
    candidateAVotes: number;
    candidateBVotes: number;
    photoBlob?: Blob;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }) => {
    try {
      const id = await saveOfflineSubmission(data);
      await updatePendingCount();
      return id;
    } catch (error) {
      console.error('Failed to save offline submission:', error);
      throw error;
    }
  }, [updatePendingCount]);

  const syncPendingSubmissions = useCallback(async (syncFn?: (submission: any) => Promise<boolean>) => {
    if (!online || isSyncing) return { synced: 0, failed: 0 };

    setIsSyncing(true);
    try {
      const defaultSyncFn = async (submission: any) => {
        // Default sync function - should be overridden with actual API call
        const response = await fetch('/api/trpc/volunteer.submitResult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            json: {
              stationId: submission.stationId,
              totalVoters: submission.totalVoters,
              validVotes: submission.validVotes,
              invalidVotes: submission.invalidVotes,
              candidateAVotes: submission.candidateAVotes,
              candidateBVotes: submission.candidateBVotes,
              latitude: submission.latitude?.toString(),
              longitude: submission.longitude?.toString(),
              notes: submission.notes,
            }
          }),
        });
        return response.ok;
      };

      const result = await syncOfflineData(syncFn || defaultSyncFn);
      await updatePendingCount();
      setLastSyncTime(new Date());
      return result;
    } catch (error) {
      console.error('Failed to sync submissions:', error);
      return { synced: 0, failed: pendingCount };
    } finally {
      setIsSyncing(false);
    }
  }, [online, isSyncing, pendingCount, updatePendingCount]);

  return {
    online,
    pendingCount,
    isSyncing,
    lastSyncTime,
    saveSubmission,
    syncPendingSubmissions,
    updatePendingCount,
  };
}

export default useOffline;
