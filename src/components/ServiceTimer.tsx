import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface StatusHistoryEntry {
  status: string;
  created_at: string;
}

interface ServiceTimerProps {
  status: 'Pendiente' | 'Llamado' | 'En Proceso' | 'Finalizado' | 'Cancelado' | string;
  statusHistory?: StatusHistoryEntry[] | null;
}

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00:00';
  }
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const ServiceTimer = ({ status, statusHistory }: ServiceTimerProps) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (!statusHistory || statusHistory.length === 0) {
      setElapsedSeconds(0);
      return;
    }

    const getTimestampForStatus = (targetStatus: string): Date | null => {
      const entry = statusHistory.find(h => h.status === targetStatus);
      return entry ? new Date(entry.created_at) : null;
    };

    if (status === 'En Proceso') {
      const startDateTime = getTimestampForStatus('En Proceso');
      
      if (startDateTime) {
        const updateElapsed = () => {
          const now = new Date();
          const diff = Math.round((now.getTime() - startDateTime.getTime()) / 1000);
          setElapsedSeconds(diff > 0 ? diff : 0);
        };
        updateElapsed();
        intervalId = setInterval(updateElapsed, 1000);
      } else {
        setElapsedSeconds(0);
      }

    } else if (status === 'Finalizado') {
      const startDateTime = getTimestampForStatus('En Proceso');
      const endDateTime = getTimestampForStatus('Finalizado');

      if (startDateTime && endDateTime) {
        const diff = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 1000);
        setElapsedSeconds(diff > 0 ? diff : 0);
      } else {
        setElapsedSeconds(0);
      }
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [status, statusHistory]);

  if (status !== 'En Proceso' && status !== 'Finalizado') {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm font-mono p-2 bg-muted rounded-md">
      <Timer className="w-4 h-4" />
      <span>{formatDuration(elapsedSeconds)}</span>
    </div>
  );
};