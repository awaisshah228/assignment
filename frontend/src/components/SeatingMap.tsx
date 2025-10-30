import { useState, useCallback, useMemo, useEffect } from 'react';
import type { VenueData, SelectedSeat } from '../types/venue';
import SeatComponent from './SeatComponent';

interface SeatingMapProps {
  venueData: VenueData;
  selectedSeats: SelectedSeat[];
  onSeatSelect: (seat: SelectedSeat) => void;
  onSeatFocus: (seat: SelectedSeat) => void;
  canSelectMore: boolean;
}

const SeatingMap = ({
  venueData,
  selectedSeats,
  onSeatSelect,
  onSeatFocus,
  canSelectMore,
}: SeatingMapProps) => {
  const [viewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    width: venueData.map.width,
    height: venueData.map.height,
  });
  const [scale, setScale] = useState(1);

  const selectedSeatIds = useMemo(
    () => new Set(selectedSeats.map((s) => s.id)),
    [selectedSeats]
  );

  const isSeatSelected = useCallback(
    (seatId: string) => selectedSeatIds.has(seatId),
    [selectedSeatIds]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.5, Math.min(3, scale * delta));
      setScale(newScale);

      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const scaleRatio = newScale / scale;
      const newWidth = viewBox.width / scaleRatio;
      const newHeight = viewBox.height / scaleRatio;

      setViewBox({
        x: viewBox.x + (x / rect.width) * (viewBox.width - newWidth),
        y: viewBox.y + (y / rect.height) * (viewBox.height - newHeight),
        width: newWidth,
        height: newHeight,
      });
    },
    [scale, viewBox]
  );

  const resetZoom = () => {
    setScale(1);
    setViewBox({
      x: 0,
      y: 0,
      width: venueData.map.width,
      height: venueData.map.height,
    });
  };

  const panMap = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      const panAmount = 100; // pixels to pan
      setViewBox((prev) => {
        switch (direction) {
          case 'left':
            return { ...prev, x: Math.max(0, prev.x - panAmount) };
          case 'right':
            return {
              ...prev,
              x: Math.min(venueData.map.width - prev.width, prev.x + panAmount),
            };
          case 'up':
            return { ...prev, y: Math.max(0, prev.y - panAmount) };
          case 'down':
            return {
              ...prev,
              y: Math.min(venueData.map.height - prev.height, prev.y + panAmount),
            };
          default:
            return prev;
        }
      });
    },
    [venueData.map.width, venueData.map.height]
  );

  // Keyboard shortcuts for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys when not focused on a seat
      if (
        e.target instanceof HTMLElement &&
        e.target.getAttribute('role') === 'button' &&
        e.target.classList.contains('seat')
      ) {
        return; // Let seat navigation handle it
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          panMap('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          panMap('right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          panMap('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          panMap('down');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panMap]);

  return (
    <div className="seating-map-container">
      <div className="controls">
        <div className="control-group">
          <button onClick={resetZoom} className="control-button reset-button">
            🔄 Reset View
          </button>
          <div className="zoom-info">Zoom: {(scale * 100).toFixed(0)}%</div>
        </div>
        
        <div className="control-group">
          <div className="pan-controls">
            <button
              onClick={() => panMap('up')}
              className="pan-button"
              aria-label="Pan up"
              title="Pan up"
            >
              ⬆️
            </button>
            <div className="pan-horizontal">
              <button
                onClick={() => panMap('left')}
                className="pan-button"
                aria-label="Pan left"
                title="Pan left"
              >
                ⬅️
              </button>
              <button
                onClick={() => panMap('down')}
                className="pan-button"
                aria-label="Pan down"
                title="Pan down"
              >
                ⬇️
              </button>
              <button
                onClick={() => panMap('right')}
                className="pan-button"
                aria-label="Pan right"
                title="Pan right"
              >
                ➡️
              </button>
            </div>
          </div>
        </div>
      </div>
      <svg
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onWheel={handleWheel}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: '#f9fafb',
        }}
        role="img"
        aria-label={`Seating map for ${venueData.name}`}
      >
        {venueData.sections.map((section) => {
          // Calculate section boundaries for background
          const allSeats = section.rows.flatMap((row) => row.seats);
          const minX = Math.min(...allSeats.map((s) => s.x)) - 20;
          const maxX = Math.max(...allSeats.map((s) => s.x)) + 20;
          const minY = Math.min(...allSeats.map((s) => s.y)) - 30;
          const maxY = Math.max(...allSeats.map((s) => s.y)) + 20;

          return (
            <g
              key={section.id}
              transform={`translate(${section.transform.x}, ${section.transform.y}) scale(${section.transform.scale})`}
            >
              {/* Section background */}
              <rect
                x={minX}
                y={minY}
                width={maxX - minX}
                height={maxY - minY}
                fill="#f9fafb"
                stroke="#e5e7eb"
                strokeWidth="1.5"
                strokeDasharray="5,5"
                rx="8"
                opacity="0.6"
              />

              {/* Section label */}
              <text
                x={minX + 10}
                y={minY + 18}
                fontSize="14"
                fontWeight="600"
                fill="#374151"
                style={{ userSelect: 'none' }}
              >
                {section.label}
              </text>

              {/* Row labels and seats */}
              {section.rows.map((row) => {
                const rowSeats = row.seats;
                const firstSeat = rowSeats[0];
                
                return (
                  <g key={row.index}>
                    {/* Row label */}
                    <text
                      x={firstSeat.x - 30}
                      y={firstSeat.y + 4}
                      fontSize="11"
                      fontWeight="500"
                      fill="#6b7280"
                      textAnchor="end"
                      style={{ userSelect: 'none' }}
                    >
                      Row {row.index}
                    </text>

                    {/* Seats */}
                    {rowSeats.map((seat) => (
                      <SeatComponent
                        key={seat.id}
                        seat={seat}
                        sectionId={section.id}
                        sectionLabel={section.label}
                        rowIndex={row.index}
                        isSelected={isSeatSelected(seat.id)}
                        onSelect={onSeatSelect}
                        onFocus={onSeatFocus}
                        canSelect={canSelectMore}
                      />
                    ))}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Stage/Arena indicator */}
        <g transform="translate(390, 600)">
          <rect
            x="-150"
            y="-50"
            width="300"
            height="100"
            fill="#1f2937"
            stroke="#374151"
            strokeWidth="3"
            rx="12"
          />
          <text
            x="0"
            y="0"
            fontSize="28"
            fontWeight="700"
            fill="#ffffff"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ userSelect: 'none' }}
          >
            STAGE
          </text>
          <text
            x="0"
            y="25"
            fontSize="12"
            fontWeight="400"
            fill="#9ca3af"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ userSelect: 'none' }}
          >
            Main Performance Area
          </text>
        </g>
      </svg>
    </div>
  );
};

export default SeatingMap;

