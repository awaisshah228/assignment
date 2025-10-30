import type { SelectedSeat } from '../types/venue';
import { getPriceForTier, formatCurrency } from '../utils/prices';

interface SeatDetailsProps {
  seat: SelectedSeat | null;
}

const SeatDetails = ({ seat }: SeatDetailsProps) => {
  if (!seat) {
    return (
      <div className="seat-details">
        <p className="placeholder">Click or focus on a seat to view details</p>
      </div>
    );
  }

  const price = getPriceForTier(seat.priceTier);

  return (
    <div className="seat-details">
      <h3>Seat Details</h3>
      <dl>
        <dt>Section:</dt>
        <dd>{seat.sectionLabel}</dd>
        
        <dt>Row:</dt>
        <dd>{seat.rowIndex}</dd>
        
        <dt>Seat:</dt>
        <dd>{seat.col}</dd>
        
        <dt>Price:</dt>
        <dd>{formatCurrency(price)}</dd>
        
        <dt>Status:</dt>
        <dd className={`status-badge status-${seat.status}`}>
          {seat.status}
        </dd>
      </dl>
    </div>
  );
};

export default SeatDetails;

