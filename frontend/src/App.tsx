import { useState } from 'react';
import { useVenueData } from './hooks/useVenueData';
import { useSeatSelection } from './hooks/useSeatSelection';
import SeatingMap from './components/SeatingMap';
import SeatDetails from './components/SeatDetails';
import SelectionSummary from './components/SelectionSummary';
import Legend from './components/Legend';
import type { SelectedSeat } from './types/venue';
import './App.css';

function App() {
  const { venueData, loading, error } = useVenueData();
  const {
    selectedSeats,
    toggleSeat,
    clearSelection,
    canSelectMore,
    maxSelections,
  } = useSeatSelection();

  const [focusedSeat, setFocusedSeat] = useState<SelectedSeat | null>(null);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading venue data...</p>
      </div>
    );
  }

  if (error || !venueData) {
    return (
      <div className="error-container">
        <h2>Error Loading Venue</h2>
        <p>{error || 'Failed to load venue data'}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>{venueData.name}</h1>
        <p className="venue-id">Venue ID: {venueData.venueId}</p>
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <Legend />
          <SeatDetails seat={focusedSeat} />
          <SelectionSummary
            selectedSeats={selectedSeats}
            maxSelections={maxSelections}
            onClear={clearSelection}
          />
        </aside>

        <main className="main-content">
          <SeatingMap
            venueData={venueData}
            selectedSeats={selectedSeats}
            onSeatSelect={toggleSeat}
            onSeatFocus={setFocusedSeat}
            canSelectMore={canSelectMore}
          />
        </main>
      </div>

      <footer className="app-footer">
        <p>
          Use mouse wheel to zoom, arrow keys or buttons to pan, click seats to select (max {maxSelections}), or use Tab + Enter for keyboard navigation
        </p>
      </footer>
    </div>
  );
}

export default App;
