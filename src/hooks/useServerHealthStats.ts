import { useQuery } from '@tanstack/react-query';

export interface ServerHealthStats {
  cpu_load_1m: number;
  memory: {
    total_gb: number;
    used_gb: number;
    usage_percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    usage_percent: number;
  };
}

const API_URL = import.meta.env.VITE_METRICS_API_URL || '/api/server-metrics';

const fetchServerHealthStats = async (): Promise<ServerHealthStats> => {
  // Hacemos la petición a la URL correcta dependiendo del entorno
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error('Network response was not ok when fetching server health stats');
  }

  return response.json();
};

export const useServerHealthStats = () => {
  return useQuery<ServerHealthStats, Error>({
    queryKey: ['serverHealthStats'],
    queryFn: fetchServerHealthStats,
    refetchInterval: 5000, // Refresca cada 5 segundos
  });
};
