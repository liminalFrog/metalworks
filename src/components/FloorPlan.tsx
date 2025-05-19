import React, { useEffect, useRef, useCallback } from 'react';

interface StructuralFrameConfig {
  columnType: string;
  columnSize: string;
  beamType: string;
  beamSize: string;
}

interface Position {
  centered: boolean;
  centerIn: string; // 'building', 'bay', 'objects'
  bay: string; // 'A', 'B', 'C', etc.
  distance: number;
  from: string; // 'left', 'right'
  edgeOf: string; // 'building', 'bay', 'object'
}

interface Door {
  dimensions: string;
  position: Position;
  subtractInsulation: boolean;
  id: string;
}

interface Window {
  dimensions: string;
  sillHeight: number;
  position: Position;
  subtractInsulation: boolean;
  id: string;
}

interface BayDoor {
  type: string; // 'roll-up', 'track'
  width: number;
  height: number;
  position: Position;
  subtractInsulation: boolean;
  id: string;
}

interface Opening {
  width: number;
  height: number;
  position: Position;
  subtractInsulation: boolean;
  id: string;
}

interface WallConfig {
  doors: Door[];
  windows: Window[];
  bayDoors: BayDoor[];
  openings: Opening[];
  // Other wall properties not needed for floor plan
}

interface WallsConfig {
  north: WallConfig;
  east: WallConfig;
  south: WallConfig;
  west: WallConfig;
}

interface FloorPlanProps {
  buildingWidth: number;
  buildingLength: number;
  bays: number;
  structuralFrames?: StructuralFrameConfig[];
  walls?: WallsConfig;
}

// Function to map structural column types to visual types
const mapColumnTypeToVisual = (columnType: string): 'I-beam' | 'square' | 'round' => {
  // W and S types are I-beams
  if (columnType === 'W' || columnType === 'S') {
    return 'I-beam';
  }
  // HSS Rect., C, T, HSS, and TS types are square
  else if (columnType === 'HSS Rect.' || columnType === 'C' || columnType === 'T' || 
           columnType === 'HSS' || columnType === 'TS') {
    return 'square';
  }
  // HSS Round and Pipe types are round
  else if (columnType === 'HSS Round' || columnType === 'Pipe') {
    return 'round';
  }
  // Default to I-beam for any unrecognized type
  return 'I-beam';
};

const FloorPlan: React.FC<FloorPlanProps> = ({ 
  buildingWidth, 
  buildingLength, 
  bays,
  structuralFrames = [],
  walls = {
    north: { doors: [], windows: [], bayDoors: [], openings: [] },
    east: { doors: [], windows: [], bayDoors: [], openings: [] },
    south: { doors: [], windows: [], bayDoors: [], openings: [] },
    west: { doors: [], windows: [], bayDoors: [], openings: [] }
  }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  // Draw an individual column
  const drawColumn = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    type: 'I-beam' | 'square' | 'round'
  ) => {
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#888';
    
    // Draw column based on type
    switch(type) {
      case 'I-beam': {
        // Draw I-beam with better appearance
        
        // Top flange
        ctx.beginPath();
        ctx.rect(x - size / 2, y - size / 2, size, size / 3);
        ctx.fill();
        ctx.stroke();
        
        // Web
        ctx.beginPath();
        ctx.rect(x - size / 6, y - size / 2 + size / 3, size / 3, size - 2 * (size / 3));
        ctx.fill();
        ctx.stroke();
        
        // Bottom flange
        ctx.beginPath();
        ctx.rect(x - size / 2, y + size / 2 - size / 3, size, size / 3);
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'square': {
        // Draw square column (HSS/Tube steel)
        ctx.beginPath();
        ctx.rect(x - size / 2, y - size / 2, size, size);
        ctx.fill();
        ctx.stroke();
        
        // Draw inner rectangle to show it's hollow
        ctx.fillStyle = '#fff';
        const innerSize = size * 0.6;
        ctx.beginPath();
        ctx.rect(x - innerSize / 2, y - innerSize / 2, innerSize, innerSize);
        ctx.fill();
        ctx.stroke();
        
        // Reset fill color
        ctx.fillStyle = '#888';
        break;
      }
      case 'round': {
        // Draw round column
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Make it look like a pipe with a small inner circle
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, size / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Reset fill color
        ctx.fillStyle = '#888';
        break;
      }
    }
  };
    // Function to get column type based on frame index - wrapped in useCallback to avoid dependency cycle
  const getColumnType = useCallback((frameIndex: number): 'I-beam' | 'square' | 'round' => {
    // Use structural frames data if available for this index
    if (structuralFrames && structuralFrames[frameIndex]) {
      return mapColumnTypeToVisual(structuralFrames[frameIndex].columnType);
    }
    
    // Default to I-beam if no frame data available
    return 'I-beam';
  }, [structuralFrames]);
  
  // Main function to draw the floor plan
  const drawFloorPlan = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper functions for drawing wall elements
    // Draw a walk door (conventional symbol: two short lines with diagonal line in between)
    const drawWalkDoor = (
      x: number, 
      y: number, 
      width: number,
      height: number, 
      orientation: 'horizontal' | 'vertical',
      direction: 'in' | 'out' = 'in' // Door swing direction
    ) => {      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000';
      
      // For doors that come from dimensions string (e.g. "3x7"), the first number is width, second is height
      const doorWidth = width; // Use actual width 
      const doorPadding = Math.max(2, doorWidth / 20); // Scale gap with door size
      const swingLength = doorWidth; // Make the diagonal swing line proportional to door width
      
      if (orientation === 'horizontal') {
        // Draw the wall break
        ctx.beginPath();
        ctx.moveTo(x - doorWidth/2, y - doorPadding);
        ctx.lineTo(x - doorWidth/2, y + doorPadding);
        ctx.moveTo(x + doorWidth/2, y - doorPadding);
        ctx.lineTo(x + doorWidth/2, y + doorPadding);
        ctx.stroke();
        
        // Draw the door swing (diagonal line)
        ctx.beginPath();
        if (direction === 'in') {
          // Door swings inside the building (down/south in horizontal orientation)
          ctx.moveTo(x - doorWidth / 2, y);
          ctx.lineTo(x - doorWidth / 2, y + swingLength);
          ctx.stroke();
          
          // Draw the arc for the door swing
          ctx.setLineDash([2, 2]); // Set to dashed line
          ctx.beginPath();
          ctx.arc(x - doorWidth / 2, y, swingLength, -Math.PI/2, 0, false);
          ctx.stroke();
          ctx.setLineDash([]); // Reset to solid line
        } else {
          // Door swings outside the building (up/north in horizontal orientation)
          ctx.moveTo(x - doorWidth / 2, y);
          ctx.lineTo(x - doorWidth / 2, y - swingLength);
          ctx.stroke();
          
          // Draw the arc for the door swing
          ctx.setLineDash([2, 2]); // Set to dashed line
          ctx.beginPath();
          ctx.arc(x - doorWidth / 2, y, swingLength, 0, -Math.PI/2, true);
          ctx.stroke();
          ctx.setLineDash([]); // Reset to solid line
        }
        ctx.stroke();
      } else {
        // Draw the wall break
        ctx.beginPath();
        ctx.moveTo(x - doorPadding, y - doorWidth/2);
        ctx.lineTo(x + doorPadding, y - doorWidth/2);
        ctx.moveTo(x - doorPadding, y + doorWidth/2);
        ctx.lineTo(x + doorPadding, y + doorWidth/2);
        ctx.stroke();
        
        // Draw the door swing (diagonal line)
        ctx.beginPath();
        if (direction === 'in') {
          // Door swings inside the building (right/east in vertical orientation)
          ctx.moveTo(x, y);
          ctx.lineTo(x + swingLength, y);
          ctx.stroke();
          
          // Draw the arc for the door swing
          ctx.setLineDash([2, 2]); // Set to dashed line
          ctx.beginPath();
          ctx.arc(x, y, -swingLength, Math.PI, Math.PI/2, true);
          ctx.stroke();
          ctx.setLineDash([]); // Reset to solid line
        } else {
          // Door swings outside the building (left/west in vertical orientation)
          ctx.moveTo(x, y);
          ctx.lineTo(x - swingLength, y);
          ctx.stroke();
          
          // Draw the arc for the door swing
          ctx.setLineDash([2, 2]); // Set to dashed line
          ctx.beginPath();
          ctx.arc(x, y, swingLength, 0, Math.PI/2, false);
          ctx.stroke();
          ctx.setLineDash([]); // Reset to solid line
        }
      }
    };
    
    // Draw a window (two short lines with thicker line in between)
    const drawWindow = (
      x: number, 
      y: number, 
      width: number,
      height: number, 
      orientation: 'horizontal' | 'vertical'
    ) => {
      ctx.strokeStyle = '#000';
      
      const windowLength = width > height ? width : height; // Use larger dimension as window length
      const windowPadding = 2; // Gap to show wall break
      const glassThickness = 2; // Thickness of the glass line
      
      if (orientation === 'horizontal') {
        // Draw the wall break
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - windowLength/2, y - windowPadding);
        ctx.lineTo(x - windowLength/2, y + windowPadding);
        ctx.moveTo(x + windowLength/2, y - windowPadding);
        ctx.lineTo(x + windowLength/2, y + windowPadding);
        ctx.stroke();
        
        // Draw the glass (thicker line)
        ctx.lineWidth = glassThickness;
        ctx.beginPath();
        ctx.moveTo(x - windowLength/2, y);
        ctx.lineTo(x + windowLength/2, y);
        ctx.stroke();
      } else {
        // Draw the wall break
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - windowPadding, y - windowLength/2);
        ctx.lineTo(x + windowPadding, y - windowLength/2);
        ctx.moveTo(x - windowPadding, y + windowLength/2);
        ctx.lineTo(x + windowPadding, y + windowLength/2);
        ctx.stroke();
        
        // Draw the glass (thicker line)
        ctx.lineWidth = glassThickness;
        ctx.beginPath();
        ctx.moveTo(x, y - windowLength/2);
        ctx.lineTo(x, y + windowLength/2);
        ctx.stroke();
      }
      
      // Reset line width
      ctx.lineWidth = 1;
    };
    
    // Draw a roll-up door (two lines and a rectangle inside the building)
    const drawRollUpDoor = (
      x: number, 
      y: number, 
      width: number, 
      height: number,
      orientation: 'horizontal' | 'vertical'
    ) => {
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000';
      
      const doorLength = width > height ? width : height; // Use larger dimension as door length
      const doorPadding = 2; // Gap to show wall break
      const rollDepth = 6; // Depth of the roll-up door inside the building
      
      if (orientation === 'horizontal') {
        // Draw the wall break
        ctx.beginPath();
        ctx.moveTo(x - doorLength/2, y - doorPadding);
        ctx.lineTo(x - doorLength/2, y + doorPadding);
        ctx.moveTo(x + doorLength/2, y - doorPadding);
        ctx.lineTo(x + doorLength/2, y + doorPadding);
        ctx.stroke();
        
        // Draw the roll-up door rectangle (inside the building)
        ctx.beginPath();
        ctx.rect(x - doorLength/2, y, doorLength, rollDepth);
        ctx.stroke();
      } else {
        // Draw the wall break
        ctx.beginPath();
        ctx.moveTo(x - doorPadding, y - doorLength/2);
        ctx.lineTo(x + doorPadding, y - doorLength/2);
        ctx.moveTo(x - doorPadding, y + doorLength/2);
        ctx.lineTo(x + doorPadding, y + doorLength/2);
        ctx.stroke();
        
        // Draw the roll-up door rectangle (inside the building)
        ctx.beginPath();
        ctx.rect(x, y - doorLength/2, rollDepth, doorLength);
        ctx.stroke();
      }
    };
    
    // Draw a track garage door (two lines extending into building with a thicker door line)
    const drawTrackDoor = (
      x: number, 
      y: number, 
      width: number, 
      height: number,
      orientation: 'horizontal' | 'vertical'
    ) => {
      ctx.strokeStyle = '#000';
      
      const doorLength = width > height ? width : height; // Use larger dimension as door length
      const doorPadding = 2; // Gap to show wall break
      const trackDepth = 8; // How far the tracks extend into the building
      const doorThickness = 2; // Thickness of the door line
      
      if (orientation === 'horizontal') {
        // Draw the wall break
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - doorLength/2, y - doorPadding);
        ctx.lineTo(x - doorLength/2, y + doorPadding);
        ctx.moveTo(x + doorLength/2, y - doorPadding);
        ctx.lineTo(x + doorLength/2, y + doorPadding);
        ctx.stroke();
        
        // Draw the tracks extending into the building
        ctx.beginPath();
        ctx.moveTo(x - doorLength/2, y);
        ctx.lineTo(x - doorLength/2, y + trackDepth);
        ctx.moveTo(x + doorLength/2, y);
        ctx.lineTo(x + doorLength/2, y + trackDepth);
        ctx.stroke();
        
        // Draw the door (thicker line)
        ctx.lineWidth = doorThickness;
        ctx.beginPath();
        ctx.moveTo(x - doorLength/2, y + 4);
        ctx.lineTo(x + doorLength/2, y + 4);
        ctx.stroke();
      } else {
        // Draw the wall break
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - doorPadding, y - doorLength/2);
        ctx.lineTo(x + doorPadding, y - doorLength/2);
        ctx.moveTo(x - doorPadding, y + doorLength/2);
        ctx.lineTo(x + doorPadding, y + doorLength/2);
        ctx.stroke();
        
        // Draw the tracks extending into the building
        ctx.beginPath();
        ctx.moveTo(x, y - doorLength/2);
        ctx.lineTo(x + trackDepth, y - doorLength/2);
        ctx.moveTo(x, y + doorLength/2);
        ctx.lineTo(x + trackDepth, y + doorLength/2);
        ctx.stroke();
        
        // Draw the door (thicker line)
        ctx.lineWidth = doorThickness;
        ctx.beginPath();
        ctx.moveTo(x + 4, y - doorLength/2);
        ctx.lineTo(x + 4, y + doorLength/2);
        ctx.stroke();
      }
      
      // Reset line width
      ctx.lineWidth = 1;
    };
    
    // Draw a simple opening (two lines with a gap)
    const drawOpening = (
      x: number, 
      y: number, 
      width: number, 
      height: number,
      orientation: 'horizontal' | 'vertical'
    ) => {
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#000';
      
      const openingLength = width > height ? width : height; // Use larger dimension as opening length
      const openingPadding = 2; // Gap to show wall break
      
      if (orientation === 'horizontal') {
        // Draw the wall break (just two lines with a gap)
        ctx.beginPath();
        ctx.moveTo(x - openingLength/2, y - openingPadding);
        ctx.lineTo(x - openingLength/2, y + openingPadding);
        ctx.moveTo(x + openingLength/2, y - openingPadding);
        ctx.lineTo(x + openingLength/2, y + openingPadding);
        ctx.stroke();
      } else {
        // Draw the wall break (just two lines with a gap)
        ctx.beginPath();
        ctx.moveTo(x - openingPadding, y - openingLength/2);
        ctx.lineTo(x + openingPadding, y - openingLength/2);
        ctx.moveTo(x - openingPadding, y + openingLength/2);
        ctx.lineTo(x + openingPadding, y + openingLength/2);
        ctx.stroke();
      }
    };

    // Get the position coordinates for an element on a wall
    const getPositionOnWall = (
      position: Position,
      wallStart: number,
      wallEnd: number,
      baysOnWall: number
    ): number => {
      let posX;
      
      if (position.centered) {
        if (position.centerIn === 'building') {
          // Center in the building wall
          posX = (wallEnd + wallStart) / 2;
        } else if (position.centerIn === 'bay' && position.bay) {
          // Center in a specific bay
          const bayIndex = position.bay.charCodeAt(0) - 65; // Convert 'A' to 0, 'B' to 1, etc.
          if (bayIndex >= 0 && bayIndex < baysOnWall) {
            const bayWidth = (wallEnd - wallStart) / baysOnWall;
            posX = wallStart + (bayIndex * bayWidth) + (bayWidth / 2);
          } else {
            // Default to center if bay is invalid
            posX = (wallEnd + wallStart) / 2;
          }
        } else {
          // Default to center if centerIn is not recognized
          posX = (wallEnd + wallStart) / 2;
        }
      } else {
        // Use the distance from a specific edge
        const wallWidth = wallEnd - wallStart;
        const bayWidth = wallWidth / baysOnWall;
        
        if (position.from === 'left') {
          if (position.edgeOf === 'building') {
            posX = wallStart + position.distance;
          } else if (position.edgeOf === 'bay' && position.bay) {
            const bayIndex = position.bay.charCodeAt(0) - 65; // Convert 'A' to 0, 'B' to 1, etc.
            if (bayIndex >= 0 && bayIndex < baysOnWall) {
              posX = wallStart + (bayIndex * bayWidth) + position.distance;
            } else {
              // Default if bay is invalid
              posX = wallStart + position.distance;
            }
          } else {
            // Default if edgeOf is not recognized
            posX = wallStart + position.distance;
          }
        } else if (position.from === 'right') {
          if (position.edgeOf === 'building') {
            posX = wallEnd - position.distance;
          } else if (position.edgeOf === 'bay' && position.bay) {
            const bayIndex = position.bay.charCodeAt(0) - 65; // Convert 'A' to 0, 'B' to 1, etc.
            if (bayIndex >= 0 && bayIndex < baysOnWall) {
              posX = wallStart + ((bayIndex + 1) * bayWidth) - position.distance;
            } else {
              // Default if bay is invalid
              posX = wallEnd - position.distance;
            }
          } else {
            // Default if edgeOf is not recognized
            posX = wallEnd - position.distance;
          }
        } else {
          // Default if from is not recognized
          posX = wallStart + position.distance;
        }
      }
      
      return posX;
    };
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up drawing constants
    const padding = 40; // Padding around the building for dimensions
    const buildingRatio = buildingWidth / buildingLength;
    
    // Calculate drawing dimensions to fit in canvas while preserving aspect ratio
    const availableWidth = canvas.width - (padding * 2);
    const availableHeight = canvas.height - (padding * 2);
    
    let drawingWidth, drawingHeight;
    
    if (buildingLength > buildingWidth) {
      // Building is longer than wide (typical)
      drawingHeight = availableHeight;
      drawingWidth = drawingHeight * buildingRatio;
      
      // If drawing is too wide, constrain by width
      if (drawingWidth > availableWidth) {
        drawingWidth = availableWidth;
        drawingHeight = drawingWidth / buildingRatio;
      }
    } else {
      // Building is wider than long (unusual)
      drawingWidth = availableWidth;
      drawingHeight = drawingWidth / buildingRatio;
      
      // If drawing is too tall, constrain by height
      if (drawingHeight > availableHeight) {
        drawingHeight = availableHeight;
        drawingWidth = drawingHeight * buildingRatio;
      }
    }
    
    // Calculate building position
    const buildingX = (canvas.width - drawingWidth) / 2;
    const buildingY = (canvas.height - drawingHeight) / 2;
    
    // Draw building outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(buildingX, buildingY, drawingWidth, drawingHeight);
    
    // Draw width dimension line
    const dimensionLineOffset = 20;
    
    // Top dimension line (width)
    ctx.beginPath();
    ctx.moveTo(buildingX, buildingY - dimensionLineOffset);
    ctx.lineTo(buildingX + drawingWidth, buildingY - dimensionLineOffset);
    ctx.stroke();
    
    // Dimension arrows (width)
    const arrowSize = 6;
    
    // Left arrow
    ctx.beginPath();
    ctx.moveTo(buildingX, buildingY - dimensionLineOffset);
    ctx.lineTo(buildingX + arrowSize, buildingY - dimensionLineOffset - arrowSize / 2);
    ctx.lineTo(buildingX + arrowSize, buildingY - dimensionLineOffset + arrowSize / 2);
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill();
    
    // Right arrow
    ctx.beginPath();
    ctx.moveTo(buildingX + drawingWidth, buildingY - dimensionLineOffset);
    ctx.lineTo(buildingX + drawingWidth - arrowSize, buildingY - dimensionLineOffset - arrowSize / 2);
    ctx.lineTo(buildingX + drawingWidth - arrowSize, buildingY - dimensionLineOffset + arrowSize / 2);
    ctx.closePath();
    ctx.fill();
    
    // Width dimension text
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${buildingWidth}'`, buildingX + drawingWidth / 2, buildingY - dimensionLineOffset - 10);
    
    // Left dimension line (length)
    ctx.beginPath();
    ctx.moveTo(buildingX - dimensionLineOffset, buildingY);
    ctx.lineTo(buildingX - dimensionLineOffset, buildingY + drawingHeight);
    ctx.stroke();
    
    // Dimension arrows (length)
    // Top arrow
    ctx.beginPath();
    ctx.moveTo(buildingX - dimensionLineOffset, buildingY);
    ctx.lineTo(buildingX - dimensionLineOffset - arrowSize / 2, buildingY + arrowSize);
    ctx.lineTo(buildingX - dimensionLineOffset + arrowSize / 2, buildingY + arrowSize);
    ctx.closePath();
    ctx.fill();
    
    // Bottom arrow
    ctx.beginPath();
    ctx.moveTo(buildingX - dimensionLineOffset, buildingY + drawingHeight);
    ctx.lineTo(buildingX - dimensionLineOffset - arrowSize / 2, buildingY + drawingHeight - arrowSize);
    ctx.lineTo(buildingX - dimensionLineOffset + arrowSize / 2, buildingY + drawingHeight - arrowSize);
    ctx.closePath();
    ctx.fill();
    
    // Length dimension text
    ctx.save();
    ctx.translate(buildingX - dimensionLineOffset - 10, buildingY + drawingHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${buildingLength}'`, 0, 0);
    ctx.restore();

    // Draw corner columns (North Wall - first frame)
    const northWallColumnType = getColumnType(0);
    drawColumn(ctx, buildingX, buildingY, 8, northWallColumnType);
    drawColumn(ctx, buildingX + drawingWidth, buildingY, 8, northWallColumnType);
    
    // Draw corner columns (South Wall - last frame)
    const southWallColumnType = getColumnType(bays);
    drawColumn(ctx, buildingX, buildingY + drawingHeight, 8, southWallColumnType);
    drawColumn(ctx, buildingX + drawingWidth, buildingY + drawingHeight, 8, southWallColumnType);
    
    // Draw bay dividers
    if (bays > 1) {
      const bayHeight = drawingHeight / bays;
      
      for (let i = 1; i < bays; i++) {
        const bayY = buildingY + (i * bayHeight);
        
        // Dashed lines for bay dividers
        ctx.beginPath();
        ctx.setLineDash([5, 3]);
        ctx.moveTo(buildingX, bayY);
        ctx.lineTo(buildingX + drawingWidth, bayY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw columns at each bay divider with the specific frame index
        // Use the correct frame index based on bay divisions
        const frameColumnType = getColumnType(i);
        drawColumn(ctx, buildingX, bayY, 8, frameColumnType);
        drawColumn(ctx, buildingX + drawingWidth, bayY, 8, frameColumnType);
      }
    }
    
    // Draw wall openings (doors, windows, etc.)
    // North wall openings
    if (walls.north && walls.north.doors) {      // Draw walk doors on north wall
      walls.north.doors.forEach(door => {
        const [width, height] = door.dimensions.split('x').map(Number);
        const scaledWidth = (width / buildingWidth) * drawingWidth;
        const scaledHeight = (height / 10) * drawingWidth / buildingWidth * 10; // Scale height proportionally to the building drawing
        const doorX = getPositionOnWall(door.position, buildingX, buildingX + drawingWidth, bays);
        drawWalkDoor(doorX, buildingY, scaledWidth, scaledHeight, 'horizontal', 'out');
      });
      
      // Draw windows on north wall
      walls.north.windows.forEach(window => {
        const [width, height] = window.dimensions.split('x').map(Number);
        const scaledWidth = (width / buildingWidth) * drawingWidth;
        const windowX = getPositionOnWall(window.position, buildingX, buildingX + drawingWidth, bays);
        drawWindow(windowX, buildingY, scaledWidth, height, 'horizontal');
      });
      
      // Draw bay doors on north wall
      walls.north.bayDoors.forEach(bayDoor => {
        const doorWidth = (bayDoor.width / buildingWidth) * drawingWidth;
        const doorX = getPositionOnWall(bayDoor.position, buildingX, buildingX + drawingWidth, bays);
        
        if (bayDoor.type === 'roll-up') {
          drawRollUpDoor(doorX, buildingY, doorWidth, bayDoor.height, 'horizontal');
        } else {
          drawTrackDoor(doorX, buildingY, doorWidth, bayDoor.height, 'horizontal');
        }
      });
      
      // Draw openings on north wall
      walls.north.openings.forEach(opening => {
        const openingWidth = (opening.width / buildingWidth) * drawingWidth;
        const openingX = getPositionOnWall(opening.position, buildingX, buildingX + drawingWidth, bays);
        drawOpening(openingX, buildingY, openingWidth, opening.height, 'horizontal');
      });
    }
    
    // South wall openings
    if (walls.south && walls.south.doors) {      // Draw walk doors on south wall
      walls.south.doors.forEach(door => {
        const [width, height] = door.dimensions.split('x').map(Number);
        const scaledWidth = (width / buildingWidth) * drawingWidth;
        const scaledHeight = (height / 10) * drawingWidth / buildingWidth * 10; // Scale height proportionally to the building drawing
        const doorX = getPositionOnWall(door.position, buildingX, buildingX + drawingWidth, bays);
        drawWalkDoor(doorX, buildingY + drawingHeight, scaledWidth, scaledHeight, 'horizontal', 'in');
      });
      
      // Draw windows on south wall
      walls.south.windows.forEach(window => {
        const [width, height] = window.dimensions.split('x').map(Number);
        const scaledWidth = (width / buildingWidth) * drawingWidth;
        const windowX = getPositionOnWall(window.position, buildingX, buildingX + drawingWidth, bays);
        drawWindow(windowX, buildingY + drawingHeight, scaledWidth, height, 'horizontal');
      });
      
      // Draw bay doors on south wall
      walls.south.bayDoors.forEach(bayDoor => {
        const doorWidth = (bayDoor.width / buildingWidth) * drawingWidth;
        const doorX = getPositionOnWall(bayDoor.position, buildingX, buildingX + drawingWidth, bays);
        
        if (bayDoor.type === 'roll-up') {
          drawRollUpDoor(doorX, buildingY + drawingHeight, doorWidth, bayDoor.height, 'horizontal');
        } else {
          drawTrackDoor(doorX, buildingY + drawingHeight, doorWidth, bayDoor.height, 'horizontal');
        }
      });
      
      // Draw openings on south wall
      walls.south.openings.forEach(opening => {
        const openingWidth = (opening.width / buildingWidth) * drawingWidth;
        const openingX = getPositionOnWall(opening.position, buildingX, buildingX + drawingWidth, bays);
        drawOpening(openingX, buildingY + drawingHeight, openingWidth, opening.height, 'horizontal');
      });
    }
    
    // East wall openings
    if (walls.east && walls.east.doors) {      // Draw walk doors on east wall
      walls.east.doors.forEach(door => {
        const [width, height] = door.dimensions.split('x').map(Number);
        const scaledWidth = (width / 10) * drawingHeight / buildingLength * 10; // Scale width proportionally to the building drawing
        const scaledHeight = (height / buildingLength) * drawingHeight;
        const doorY = getPositionOnWall(door.position, buildingY, buildingY + drawingHeight, bays);
        drawWalkDoor(buildingX + drawingWidth, doorY, scaledWidth, scaledHeight, 'vertical', 'in');
      });
      
      // Draw windows on east wall
      walls.east.windows.forEach(window => {
        const [width, height] = window.dimensions.split('x').map(Number);
        const scaledHeight = (height / buildingLength) * drawingHeight;
        const windowY = getPositionOnWall(window.position, buildingY, buildingY + drawingHeight, bays);
        drawWindow(buildingX + drawingWidth, windowY, width, scaledHeight, 'vertical');
      });
      
      // Draw bay doors on east wall
      walls.east.bayDoors.forEach(bayDoor => {
        const doorHeight = (bayDoor.height / buildingLength) * drawingHeight;
        const doorY = getPositionOnWall(bayDoor.position, buildingY, buildingY + drawingHeight, bays);
        
        if (bayDoor.type === 'roll-up') {
          drawRollUpDoor(buildingX + drawingWidth, doorY, bayDoor.width, doorHeight, 'vertical');
        } else {
          drawTrackDoor(buildingX + drawingWidth, doorY, bayDoor.width, doorHeight, 'vertical');
        }
      });
      
      // Draw openings on east wall
      walls.east.openings.forEach(opening => {
        const openingHeight = (opening.height / buildingLength) * drawingHeight;
        const openingY = getPositionOnWall(opening.position, buildingY, buildingY + drawingHeight, bays);
        drawOpening(buildingX + drawingWidth, openingY, opening.width, openingHeight, 'vertical');
      });
    }
    
    // West wall openings
    if (walls.west && walls.west.doors) {      // Draw walk doors on west wall
      walls.west.doors.forEach(door => {
        const [width, height] = door.dimensions.split('x').map(Number);
        const scaledWidth = (width / 10) * drawingHeight / buildingLength * 10; // Scale width proportionally to the building drawing
        const scaledHeight = (height / buildingLength) * drawingHeight;
        const doorY = getPositionOnWall(door.position, buildingY, buildingY + drawingHeight, bays);
        drawWalkDoor(buildingX, doorY, scaledWidth, scaledHeight, 'vertical', 'out');
      });
      
      // Draw windows on west wall
      walls.west.windows.forEach(window => {
        const [width, height] = window.dimensions.split('x').map(Number);
        const scaledHeight = (height / buildingLength) * drawingHeight;
        const windowY = getPositionOnWall(window.position, buildingY, buildingY + drawingHeight, bays);
        drawWindow(buildingX, windowY, width, scaledHeight, 'vertical');
      });
      
      // Draw bay doors on west wall
      walls.west.bayDoors.forEach(bayDoor => {
        const doorHeight = (bayDoor.height / buildingLength) * drawingHeight;
        const doorY = getPositionOnWall(bayDoor.position, buildingY, buildingY + drawingHeight, bays);
        
        if (bayDoor.type === 'roll-up') {
          drawRollUpDoor(buildingX, doorY, bayDoor.width, doorHeight, 'vertical');
        } else {
          drawTrackDoor(buildingX, doorY, bayDoor.width, doorHeight, 'vertical');
        }
      });
      
      // Draw openings on west wall
      walls.west.openings.forEach(opening => {
        const openingHeight = (opening.height / buildingLength) * drawingHeight;
        const openingY = getPositionOnWall(opening.position, buildingY, buildingY + drawingHeight, bays);
        drawOpening(buildingX, openingY, opening.width, openingHeight, 'vertical');
      });
    }
  }, [buildingWidth, buildingLength, bays, walls, getColumnType]);

  // Setup the resize observer and initial drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container) return;
    
    // Function to handle resize
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      
      // Set canvas dimensions to match container size
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Redraw the floor plan with the new dimensions
      drawFloorPlan();
    };
    
    // Initial setup
    handleResize();
    
    // Setup resize observer to handle window/container size changes
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }
    
    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(container);
    
    // Cleanup
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [drawFloorPlan]);
  
  return (
    <div className="floor-plan-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="floor-plan-canvas"
      />
    </div>
  );
};

export default FloorPlan;
