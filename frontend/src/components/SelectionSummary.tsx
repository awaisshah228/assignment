import type { SelectedSeat } from '../types/venue';
import { getPriceForTier, formatCurrency } from '../utils/prices';

interface SelectionSummaryProps {
  selectedSeats: SelectedSeat[];
  maxSelections: number;
  onClear: () => void;
}

const SelectionSummary = ({
  selectedSeats,
  maxSelections,
  onClear,
}: SelectionSummaryProps) => {
  const subtotal = selectedSeats.reduce(
    (sum, seat) => sum + getPriceForTier(seat.priceTier),
    0
  );

  return (
    <div className="selection-summary">
      <div className="summary-header">
        <h3>Your Selection</h3>
        <span className="selection-count">
          {selectedSeats.length} / {maxSelections}
        </span>
      </div>

      {selectedSeats.length === 0 ? (
        <p className="empty-message">No seats selected</p>
      ) : (
        <>
          <ul className="selected-seats-list">
            {selectedSeats.map((seat) => (
              <li key={seat.id}>
                <span className="seat-info">
                  {seat.sectionLabel} - Row {seat.rowIndex}, Seat {seat.col}
                </span>
                <span className="seat-price">
                  {formatCurrency(getPriceForTier(seat.priceTier))}
                </span>
              </li>
            ))}
          </ul>

          <div className="summary-footer">
            <div className="subtotal">
              <span className="label">Subtotal:</span>
              <span className="amount">{formatCurrency(subtotal)}</span>
            </div>
            <button onClick={onClear} className="clear-button">
              Clear Selection
            </button>
          </div>
        </>
      )}

      {selectedSeats.length >= maxSelections && (
        <p className="warning-message">
          Maximum number of seats reached
        </p>
      )}
    </div>
  );
};

export default SelectionSummary;

