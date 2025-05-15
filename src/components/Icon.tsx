// This is a basic React component for the Metal Works Icon
import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
}

const Icon: React.FC<IconProps> = ({ size = 24, color = '#2176FF' }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Building with roof */}
      <path d="M2 12L12 2L22 12H18V22H6V12H2Z" fill={color} stroke="#000000" strokeWidth="1.5" />
      
      {/* Windows/doors representation */}
      <rect x="8" y="14" width="3" height="4" fill="white" stroke="#000000" strokeWidth="0.5" />
      <rect x="13" y="14" width="3" height="4" fill="white" stroke="#000000" strokeWidth="0.5" />
      <rect x="10" y="8" width="4" height="3" fill="white" stroke="#000000" strokeWidth="0.5" />
      
      {/* Metal beams representation */}
      <line x1="4" y1="12" x2="20" y2="12" stroke="#000000" strokeWidth="0.75" />
      <line x1="12" y1="4" x2="12" y2="20" stroke="#000000" strokeWidth="0.75" />
    </svg>
  );
};

export default Icon;