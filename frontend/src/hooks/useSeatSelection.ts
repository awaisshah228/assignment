import { useState, useEffect, useCallback } from 'react';
import type { SelectedSeat } from '../types/venue';

const STORAGE_KEY = 'seating-map-selection';
const MAX_SELECTIONS = 8;

export const useSeatSelection = () => {
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSeats));
    } catch (err) {
      console.error('Failed to save selection to localStorage', err);
    }
  }, [selectedSeats]);

  const toggleSeat = useCallback((seat: SelectedSeat) => {
    setSelectedSeats((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === seat.id);
      
      if (existingIndex >= 0) {
        // Remove seat if already selected
        return prev.filter((_, i) => i !== existingIndex);
      } else if (prev.length < MAX_SELECTIONS) {
        // Add seat if under limit
        return [...prev, seat];
      }
      
      // Return unchanged if at max limit
      return prev;
    });
  }, []);

  const isSeatSelected = useCallback(
    (seatId: string) => selectedSeats.some((s) => s.id === seatId),
    [selectedSeats]
  );

  const clearSelection = useCallback(() => {
    setSelectedSeats([]);
  }, []);

  const canSelectMore = selectedSeats.length < MAX_SELECTIONS;

  return {
    selectedSeats,
    toggleSeat,
    isSeatSelected,
    clearSelection,
    canSelectMore,
    maxSelections: MAX_SELECTIONS,
  };
};

