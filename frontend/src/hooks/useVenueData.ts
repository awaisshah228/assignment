import { useState, useEffect } from 'react';
import type { VenueData } from '../types/venue';

export const useVenueData = () => {
  const [venueData, setVenueData] = useState<VenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        const response = await fetch('/venue.json');
        if (!response.ok) {
          throw new Error('Failed to fetch venue data');
        }
        const data: VenueData = await response.json();
        setVenueData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchVenueData();
  }, []);

  return { venueData, loading, error };
};

