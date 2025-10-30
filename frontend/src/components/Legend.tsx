const Legend = () => {
  const seatPath = "M2,8 L2,12 C2,13 3,14 4,14 L12,14 C13,14 14,13 14,12 L14,8 L12,8 L12,4 C12,2 10,0 8,0 C6,0 4,2 4,4 L4,8 Z";

  const items = [
    { color: '#10b981', label: 'Available' },
    { color: '#2563eb', label: 'Selected', showCheck: true },
    { color: '#f59e0b', label: 'Reserved' },
    { color: '#ef4444', label: 'Sold' },
    { color: '#8b5cf6', label: 'Held' },
  ];

  return (
    <div className="legend">
      <h3>Legend</h3>
      <div className="legend-items">
        {items.map((item) => (
          <div key={item.label} className="legend-item">
            <svg width="24" height="24" viewBox="0 0 16 16" className="legend-icon">
              <path
                d={seatPath}
                fill={item.color}
                stroke="#fff"
                strokeWidth="0.5"
              />
              {item.showCheck && (
                <>
                  <circle cx="8" cy="7" r="3" fill="#fff" opacity="0.9" />
                  <path
                    d="M6.5,7 L7.5,8 L9.5,6"
                    stroke="#1e40af"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </>
              )}
            </svg>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;

