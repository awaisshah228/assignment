import { memo } from 'react';
import type { Seat, SelectedSeat } from '../types/venue';

interface SeatComponentProps {
  seat: Seat;
  sectionId: string;
  sectionLabel: string;
  rowIndex: number;
  isSelected: boolean;
  onSelect: (seat: SelectedSeat) => void;
  onFocus: (seat: SelectedSeat) => void;
  canSelect: boolean;
}

const SeatComponent = ({
  seat,
  sectionId,
  sectionLabel,
  rowIndex,
  isSelected,
  onSelect,
  onFocus,
  canSelect,
}: SeatComponentProps) => {
  const isAvailable = seat.status === 'available';
  const isInteractive = isAvailable || isSelected;

  const handleClick = () => {
    if (isInteractive && (canSelect || isSelected)) {
      onSelect({ ...seat, sectionId, sectionLabel, rowIndex });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && isInteractive && (canSelect || isSelected)) {
      e.preventDefault();
      onSelect({ ...seat, sectionId, sectionLabel, rowIndex });
    }
  };

  const handleFocus = () => {
    onFocus({ ...seat, sectionId, sectionLabel, rowIndex });
  };

  const getStatusColor = () => {
    if (isSelected) return '#2563eb'; // blue-600
    switch (seat.status) {
      case 'available':
        return '#10b981'; // green-500
      case 'reserved':
        return '#f59e0b'; // amber-500
      case 'sold':
        return '#ef4444'; // red-500
      case 'held':
        return '#8b5cf6'; // violet-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const ariaLabel = `Section ${sectionLabel}, Row ${rowIndex}, Seat ${seat.col}, Price tier ${seat.priceTier}, ${seat.status}${isSelected ? ', selected' : ''}`;

  // Seat icon SVG path (theater seat shape)
  const seatPath = "M2,8 L2,12 C2,13 3,14 4,14 L12,14 C13,14 14,13 14,12 L14,8 L12,8 L12,4 C12,2 10,0 8,0 C6,0 4,2 4,4 L4,8 Z";

  return (
    <g
      transform={`translate(${seat.x - 7}, ${seat.y - 7})`}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      onFocus={isInteractive ? handleFocus : undefined}
      tabIndex={isInteractive ? 0 : -1}
      role="button"
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      style={{
        cursor: isInteractive && (canSelect || isSelected) ? 'pointer' : 'not-allowed',
        outline: 'none',
      }}
      className="seat"
    >
      {/* Seat icon */}
      <path
        d={seatPath}
        fill={getStatusColor()}
        stroke={isSelected ? '#1e40af' : '#fff'}
        strokeWidth={isSelected ? 1.5 : 0.5}
        opacity={isInteractive ? 1 : 0.5}
        style={{
          transition: 'all 0.2s',
        }}
      />
      {/* Selection indicator */}
      {isSelected && (
        <circle
          cx="8"
          cy="7"
          r="3"
          fill="#fff"
          opacity="0.9"
        />
      )}
      {isSelected && (
        <path
          d="M6.5,7 L7.5,8 L9.5,6"
          stroke="#1e40af"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
      
      {/* Seat number label (show below the seat) */}
      <text
        x="8"
        y="20"
        fontSize="8"
        fontWeight="500"
        fill={isSelected ? '#1e40af' : '#6b7280'}
        textAnchor="middle"
        style={{ 
          userSelect: 'none',
          pointerEvents: 'none',
          opacity: isInteractive ? 0.8 : 0.4,
        }}
      >
        {seat.col}
      </text>
    </g>
  );
};

export default memo(SeatComponent);

