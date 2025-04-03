
import React from 'react';

interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  stroke: string;
  strokeWidth: number;
  isDashed?: boolean;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  startX,
  startY,
  endX,
  endY,
  stroke,
  strokeWidth,
  isDashed = false
}) => {
  // Calculate control points for a smooth curve
  const midX = (startX + endX) / 2;
  
  // Create a bezier curve path
  const pathData = `
    M ${startX} ${startY}
    C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}
  `;

  return (
    <>
      {/* Invisible wider path for better hover detection */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={strokeWidth + 16} // 8px offset on each side
        className="connection-line-hitarea"
      />
      
      {/* Visible path */}
      <path
        d={pathData}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={isDashed ? "5,5" : "none"}
        className="connection-line"
      />
    </>
  );
};

export default ConnectionLine;
