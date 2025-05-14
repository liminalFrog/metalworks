export interface BuildingData {
  length: number;
  width: number;
  height: number;
  pitch?: number;      // For backwards compatibility
  roofPitch?: number;  // Currently used in App.tsx
  bays: number;
  gutters: string;
  manDoors: { width: number; height: number }[];
  rollUpDoors: { width: number; height: number }[];
  windows: { width: number; height: number }[];
  awnings: { width: number; height: number }[];
  panelType?: string;
  roofOverhang?: number; // Amount to add to roof panel length (in inches)
  roofPeakGap?: number;  // Gap to leave at peak (in inches)
  purlins?: {
    size: string;
    spacing: number;
    maxGap: number;
  };
  walls?: {
    [key: string]: {
      girts: {
        size: string;
        spacing: number;
        maxGap: number;
        sizeLocked?: boolean;
        spacingLocked?: boolean;
        maxGapLocked?: boolean;
      };
      // Other wall properties not needed for this feature
      [key: string]: any;
    };
  };
  structuralFrames?: {
    columnType: string;
    columnSize: string;
    beamType: string;
    beamSize: string;
  }[];
}

// Function to convert decimal feet to feet and inches
export function toFeetAndInches(decimalFeet: number): string {
  // Add validation to handle NaN or undefined values
  if (decimalFeet === undefined || isNaN(decimalFeet)) {
    console.warn('Invalid value passed to toFeetAndInches:', decimalFeet);
    return '0\'';
  }
  
  const feet = Math.floor(decimalFeet);
  const decimalPart = decimalFeet - feet;
  const inches = Math.round(decimalPart * 12);
  if (inches === 0) {
    return `${feet}'`;
  }
  return `${feet}'${inches}"`;
}

// Function to calculate wall panel area (placeholder, implement as needed)
function calculateWallPanelArea(buildingData: BuildingData): number {
  // Example calculation, replace with actual logic
  return buildingData.length * buildingData.height * 2 + buildingData.width * buildingData.height * 2;
}

// Function to generate detailed structural element descriptions
function generateStructuralDetails(
  structuralFrames: { columnType: string; columnSize: string; beamType: string; beamSize: string }[],
  totalColumnsWithCenters: number,
  totalRafters: number,
  height: number,
  slopeLengthPerSide: number
): string {
  // Group columns by type and size
  const columnGroups: { [key: string]: number } = {};
  const beamGroups: { [key: string]: number } = {};
  
  structuralFrames.forEach(frame => {
    // For columns - each frame has 2 columns
    const columnKey = `${frame.columnType} ${frame.columnSize}`;
    columnGroups[columnKey] = (columnGroups[columnKey] || 0) + 2;
    
    // For beams/rafters - each frame has 2 rafters
    const beamKey = `${frame.beamType} ${frame.beamSize}`;
    beamGroups[beamKey] = (beamGroups[beamKey] || 0) + 2;
  });
  
  // Generate column output
  let columnOutput = '';
  Object.keys(columnGroups).forEach(columnType => {
    columnOutput += `- ${columnType} Columns: ${columnGroups[columnType]} @ ${toFeetAndInches(height)} each\n`;
  });
  
  // Add center columns if any (these will be generic I-beams)
  const centerColumns = totalColumnsWithCenters - (structuralFrames.length * 2);
  if (centerColumns > 0) {
    columnOutput += `- Center Columns (I-beams): ${centerColumns} @ ${toFeetAndInches(height)} each\n`;
  }
  
  // Generate rafter/beam output
  let beamOutput = '';
  Object.keys(beamGroups).forEach(beamType => {
    beamOutput += `- ${beamType} Rafters: ${beamGroups[beamType]} @ ${toFeetAndInches(slopeLengthPerSide)} each\n`;
  });
  
  return columnOutput + beamOutput;
}

// Function to calculate girt clips needed
function calculateGirtClips(
  bays: number,
  wallGirtsPerSideHeightSidewall: number,
  wallGirtsPerSideHeightEndwall: number,
  totalColumnsWithCenters: number,
  centerColumnsFront: number,
  centerColumnsBack: number
): number {
  // Calculate clips for sidewalls
  // Each sidewall girt connects to a column at each end and at each intermediate column
  // For each sidewall, there are (bays + 1) columns and wallGirtsPerSideHeightSidewall girts per wall
  const sidewallClips = wallGirtsPerSideHeightSidewall * 2 * (bays + 1); // 2 sidewalls
  
  // Calculate clips for endwalls
  // Each endwall has 2 corner columns plus potentially 1 center column
  const frontEndwallColumns = 2 + centerColumnsFront; // 2 corner columns + center column (if present)
  const backEndwallColumns = 2 + centerColumnsBack; // 2 corner columns + center column (if present)
  
  // Each endwall girt connects to each column on that wall
  const frontEndwallClips = wallGirtsPerSideHeightEndwall * frontEndwallColumns;
  const backEndwallClips = wallGirtsPerSideHeightEndwall * backEndwallColumns;
  
  // Total clips
  const totalClips = sidewallClips + frontEndwallClips + backEndwallClips;
  
  // Round up to the nearest even number as requested
  return Math.ceil(totalClips / 2) * 2;
}

export function generateMaterialTakeoff(data: BuildingData): string {
  // Extract pitch from data.pitch or data.roofPitch for compatibility
  const pitch = data.pitch || data.roofPitch || 3; // Default to 3 if not found
  
  const { length, width, height, bays, gutters: guttersOption, panelType } = data;
  const manDoors = data.manDoors || [];
  const rollUpDoors = data.rollUpDoors || [];
  const windows = data.windows || [];
  const awnings = data.awnings || [];
  const panelWidth = 3; // Standard panel width

  // Panel waste factor based on panel type
  const panelWasteFactor = {
    'r-panel': 0.05,      // 5% waste
    'pbr': 0.06,          // 6% waste
    'u-panel': 0.05,      // 5% waste
    'standing-seam': 0.08, // 8% waste due to more complex installation
    'corrugated': 0.04,    // 4% waste
  }[panelType || ''] || 0.05; // Default to 5% if unknown

  // Use this factor in your square footage calculations
  const wallPanelSqFt = calculateWallPanelArea(data) * (1 + panelWasteFactor);  // Calculate slope multiplier for gabled roof (per side)
  const runPerSide = width / 2 || 0; // Horizontal run per side, default to 0 if not defined
  const risePerSide = ((pitch || 0) / 12) * runPerSide; // Vertical rise per side
  let slopeLengthPerSide = 0;
  try {
    slopeLengthPerSide = Math.sqrt(runPerSide ** 2 + risePerSide ** 2); // Sloped length per side
  } catch (error) {
    console.error('Error calculating slope length:', error);
    slopeLengthPerSide = Math.max(runPerSide, 10);
  }
  
  const totalSlopeLength = slopeLengthPerSide * 2; // Total sloped length (for reference)
  
  // Apply overhang and peak gap adjustments to roof panel length
  const overhangInches = data.roofOverhang !== undefined ? data.roofOverhang : 2;
  const peakGapInches = data.roofPeakGap !== undefined ? data.roofPeakGap : 1;
  
  // Initialize roofPanelLength in the outer scope
  let roofPanelLength: number = 0;
  
  try {
    // Validate inputs before calculation
    if (isNaN(slopeLengthPerSide) || isNaN(overhangInches) || isNaN(peakGapInches)) {
      console.error('Invalid values for roof panel length calculation:', {
        slopeLengthPerSide,
        overhangInches,
        peakGapInches
      });
      // Provide a fallback value based on building dimensions
      roofPanelLength = Math.max(10, width / 2); // Fallback to half width or minimum 10'
    } else {
      roofPanelLength = slopeLengthPerSide + (overhangInches / 12) - (peakGapInches / 24); // Add overhang, subtract half of peak gap
    }
  } catch (error) {
    console.error('Error calculating roof panel length:', error);
    roofPanelLength = Math.max(10, width / 2); // Fallback to half width or minimum 10'
  }
  
  // Final validation to ensure we have a valid number
  if (isNaN(roofPanelLength) || !isFinite(roofPanelLength)) {
    roofPanelLength = 20; // Last resort fallback
  }

  // Gabled roof height calculations
  const ridgeHeight = height + risePerSide; // Height at the ridge
  const slopePerFoot = risePerSide / runPerSide; // Rise per foot along the width

  // I-beams (columns and rafters)
  const bayLength = length / bays; // Length of each bay (20' for 2 bays)
  const rafterAssemblies = bays + 1; // One at each end and between bays (0', 20', 40')
  const columnsPerAssembly = 2;
  const totalColumns = rafterAssemblies * columnsPerAssembly; // 3 assemblies * 2 = 6
  const raftersPerAssembly = 2; // 2 rafters per assembly (bolted at apex)
  const totalRafters = rafterAssemblies * raftersPerAssembly; // 3 assemblies * 2 = 6

  // Check if center columns are needed for gabled endwalls
  let centerColumnsFront = 1; // Default - one center column for front gabled endwall
  let centerColumnsBack = 1; // Default - one center column for back gabled endwall

  // Check if any roll-up door interferes with center column position
  const centerPosition = width / 2;
  // Front gable
  let rollUpDoorsFront: any[] = [];
  let rollUpDoorsBack: any[] = [];
  
  rollUpDoors.forEach((door, index) => {
    if (index < 2) { // Front gabled end wall
      rollUpDoorsFront.push({ width: door.width, height: door.height });
    } else { // Back gabled end wall
      rollUpDoorsBack.push({ width: door.width, height: door.height });
    }
  });

  if (rollUpDoorsFront.length > 0) {
    for (let i = 0; i < rollUpDoorsFront.length; i++) {
      const doorStart = rollUpDoorsFront[i].start || 0;
      const doorEnd = doorStart + rollUpDoorsFront[i].width;
      if (doorStart <= centerPosition && doorEnd >= centerPosition) {
        centerColumnsFront = 0; // Remove center column if door spans center
        break;
      }
    }
  }

  // Back gable
  if (rollUpDoorsBack.length > 0) {
    for (let i = 0; i < rollUpDoorsBack.length; i++) {
      const doorStart = rollUpDoorsBack[i].start || 0;
      const doorEnd = doorStart + rollUpDoorsBack[i].width;
      if (doorStart <= centerPosition && doorEnd >= centerPosition) {
        centerColumnsBack = 0; // Remove center column if door spans center
        break;
      }
    }
  }  // Add center columns to total column count
  const totalColumnsWithCenters = totalColumns + centerColumnsFront + centerColumnsBack;

  // Calculate welded tabs needed for girt terminations at roll-up door jambs
  let weldedTabsNeeded = 0;
  // Front gable wall
  let wallGirtsPerSideHeightEndwall = Math.floor(height / 5) + 1; // Start at 0', girts at 5', 10', final at eave (12')
  if (centerColumnsFront === 0) {
    // Each girt level needs two tabs per door (left and right side)
    weldedTabsNeeded += wallGirtsPerSideHeightEndwall * 2 * rollUpDoorsFront.length;
  }
  // Back gable wall
  if (centerColumnsBack === 0) {
    // Each girt level needs two tabs per door (left and right side)
    weldedTabsNeeded += wallGirtsPerSideHeightEndwall * 2 * rollUpDoorsBack.length;
  }  // Purlins (5' spacing along the slope)
  const purlinsPerSide = Math.ceil(slopeLengthPerSide / 5); // Calculate purlins based on sloped length
  const totalPurlinLines = purlinsPerSide * 2; // Total purlin lines (both sides of roof)
  const purlinSegmentsPerLine = bays; // Each line split at rafters
  const totalPurlinPieces = totalPurlinLines * purlinSegmentsPerLine; // Total number of purlin pieces
  // For roof purlins and other horizontal elements
  const purlinLength = bayLength; // Horizontal purlins use standard bay length

  // Wall girts (sidewalls: fixed at 5' and 10'; gabled end walls: 5' spacing from base, final girt at eave height, additional girt if peak distance > 7')
  const wallGirtsPerSideHeightSidewall = 2; // Fixed at 5' and 10' for sidewalls
  const girtSpacing = 5; // 5' spacing for gabled end walls
  const distanceToPeak = ridgeHeight - height; // Distance from eave to peak
  if (distanceToPeak > 7) {
    wallGirtsPerSideHeightEndwall += 1; // Add an additional girt if distance to peak exceeds 7'
  }
  const totalWallGirtsLinesSidewall = wallGirtsPerSideHeightSidewall * 2; // 2 girts * 2 sidewalls = 4 lines
  const totalWallGirtsLinesEndwall = wallGirtsPerSideHeightEndwall * 2; // 3 girts * 2 end walls = 6 lines
  const girtSegmentsPerLineSidewall = bays; // Sidewall girts split at columns (2 segments: 0'-20', 20'-40')
  const totalGirtPiecesSidewall = wallGirtsPerSideHeightSidewall * 2 * girtSegmentsPerLineSidewall; // 2 * 2 * 2 = 8 pieces
  const totalGirtPiecesEndwall = wallGirtsPerSideHeightEndwall * 2; // 3 girts * 2 end walls = 6 pieces
  const totalGirtPieces = totalGirtPiecesSidewall + totalGirtPiecesEndwall; // 8 + 6 = 14 pieces
  const girtLength = bayLength; // Each piece matches the bay length (20')
  // Calculate girt clips needed for structural connections 
  // Each girt requires a clip where it attaches to a column
  // Group clips by girt size for each wall
  
  // Get the walls data, or use default values if not available
  const walls = data.walls || {
    north: { girts: { size: '2x6' } },
    east: { girts: { size: '2x6' } },
    south: { girts: { size: '2x6' } },
    west: { girts: { size: '2x6' } }
  };
  
  // Track girt clips per size
  const girtClipsBySize: {[size: string]: number} = {};
  
  // North wall (endwall)
  const northWallGirtSize = (walls.north && walls.north.girts && walls.north.girts.size) ? walls.north.girts.size : '2x6';
  const northWallClips = wallGirtsPerSideHeightEndwall * (2 + centerColumnsFront);
  girtClipsBySize[northWallGirtSize] = (girtClipsBySize[northWallGirtSize] || 0) + northWallClips;
  
  // South wall (endwall)
  const southWallGirtSize = (walls.south && walls.south.girts && walls.south.girts.size) ? walls.south.girts.size : '2x6';
  const southWallClips = wallGirtsPerSideHeightEndwall * (2 + centerColumnsBack);
  girtClipsBySize[southWallGirtSize] = (girtClipsBySize[southWallGirtSize] || 0) + southWallClips;
  
  // East wall (sidewall)
  const eastWallGirtSize = (walls.east && walls.east.girts && walls.east.girts.size) ? walls.east.girts.size : '2x6';
  const eastWallClips = wallGirtsPerSideHeightSidewall * (bays + 1);
  girtClipsBySize[eastWallGirtSize] = (girtClipsBySize[eastWallGirtSize] || 0) + eastWallClips;
  
  // West wall (sidewall)
  const westWallGirtSize = (walls.west && walls.west.girts && walls.west.girts.size) ? walls.west.girts.size : '2x6';
  const westWallClips = wallGirtsPerSideHeightSidewall * (bays + 1);
  girtClipsBySize[westWallGirtSize] = (girtClipsBySize[westWallGirtSize] || 0) + westWallClips;
  
  // Round each size's clip count to the nearest even number
  Object.keys(girtClipsBySize).forEach(size => {
    girtClipsBySize[size] = Math.ceil(girtClipsBySize[size] / 2) * 2;
  });

  // Base Angle (along the perimeter at foundation and along gabled end wall roof lines, as a structural component)
  const baseAnglePerimeterLengthOriginal = (length * 2) + (width * 2); // Perimeter at foundation (160')
  const rollUpDoorWidths = rollUpDoors.map(door => door.width);
  const totalRollUpDoorWidth = rollUpDoorWidths.reduce((sum, w) => sum + w, 0);
  const baseAnglePerimeterLength = baseAnglePerimeterLengthOriginal - totalRollUpDoorWidth;
  const baseAnglePerimeterPieces = Math.ceil(baseAnglePerimeterLength / 20); // 124' / 20' = 7 pieces at 20' each
  const gabledEndRoofLinePieces = 4; // 4 sloped sides (2 per gabled end wall), each requiring a single 25' piece
  const gabledEndRoofLineLength = 25; // Using 25' pieces to avoid splicing (will need to be cut to 20'7")
  const baseAnglePerimeterOutput = `- Base Angle (4"x2") for Foundation: ${baseAnglePerimeterPieces} @ 20' each (Note: 25' pieces also available; excludes roll-up door areas)`;
  const baseAngleGabledOutput = `- Base Angle (4"x2") for Gabled End Wall Roof Lines: ${gabledEndRoofLinePieces} @ ${toFeetAndInches(gabledEndRoofLineLength)} each (single pieces to avoid splicing; cut to 20'7")`;

  // Sheeting (panels perpendicular to eaves)
  const roofPanels = Math.ceil(length / panelWidth) * 2; // Both roof sides

  // Panel Closures (outside and inside, matching the number of roof panels)
  const outsidePanelClosures = roofPanels; // Same as number of roof panels
  const insidePanelClosures = roofPanels;  // Same as number of roof panels
  
  const panelClosuresOutput = `
- Outside Panel Closures: ${outsidePanelClosures}
- Inside Panel Closures: ${insidePanelClosures}`;

  // Peak Boxes (1 per end of the gabled roof, total 2)
  const peakBoxes = 2; // 1 peak box per end (front and back)
  const peakBoxesOutput = `- Peak Boxes: ${peakBoxes}`;

  // Sculpted Rake Trim (4 pieces, each the length of the roof panels)
  const rakeTrimPieces = 4; // One for each rake edge (2 gabled ends * 2 edges per end)
  const rakeTrimLength = roofPanelLength; // Matches the roof panel length (20'9")
  const rakeTrimOutput = `- Sculpted Rake Trim: ${rakeTrimPieces} @ ${toFeetAndInches(rakeTrimLength)} each`;

  // Ridge Roll (along the peak of the building)
  const ridgeRollLength = length; // Matches the building length (40')
  const ridgeRollOutput = `- Ridge Roll: 1 @ ${toFeetAndInches(ridgeRollLength)}`;

  // Sculpted Corner Trim (4 pieces, each the height of the eaves)
  const cornerTrimPieces = 4; // One for each corner of the building
  const cornerTrimLength = height; // Matches the eave height (12')
  const cornerTrimOutput = `- Sculpted Corner Trim: ${cornerTrimPieces} @ ${toFeetAndInches(cornerTrimLength)} each`;

  // Wall panels: Separate side walls and gabled end walls, no reductions
  const sideWallPanelsPerWall = Math.ceil(length / panelWidth); // Panels per sidewall (14)
  const totalSideWallPanels = sideWallPanelsPerWall * 2; // 14 * 2 = 28
 
  // Sidewall panels: Set to eave height, fixed at 14 per sidewall
  let sideWallPanelHeights = Array(sideWallPanelsPerWall).fill(height); // All panels at eave height
  const sideWallPanelHeightsFormatted = sideWallPanelHeights.map(h => toFeetAndInches(h));

  // Calculate heights for gabled end wall panels (from base to gable roofline along the width)
  let gabledEndPanelHeights: number[] = [];
  for (let i = 0; i < sideWallPanelsPerWall; i++) {
    const leftPos = i * panelWidth;
    const rightPos = (i + 1) * panelWidth;
    let heightAtPos;
    if (leftPos < width / 2 && rightPos <= width / 2) {
      // Left of peak: use right edge
      heightAtPos = height + Math.min(rightPos, width - rightPos) * slopePerFoot;
    } else if (leftPos >= width / 2) {
      // Right of peak: use left edge
      heightAtPos = height + Math.min(leftPos, width - leftPos) * slopePerFoot;
    } else {
      // Straddles peak: use peak height
      heightAtPos = ridgeHeight;
    }
    gabledEndPanelHeights.push(heightAtPos);
  }
  const gabledEndPanelHeightsFormatted = gabledEndPanelHeights.map(h => toFeetAndInches(h));

  // Drip Flashing (around the base of the walls)
  const dripFlashingPieces = 4; // 4 walls (2 sidewalls, 2 gabled end walls)
  const dripFlashingLength = length; // Each piece matches the wall length (40', assuming square building)

  const dripFlashingOutput = `
- Drip Flashing (Base of Walls): ${dripFlashingPieces} @ ${toFeetAndInches(dripFlashingLength)} each`;

  // Gutters or Eave Trim
  let gutterOutput = '';
  if (guttersOption === 'no') {
    // Eave Trim: 1 per sidewall
    const eaveTrimPieces = 2; // 2 sidewalls
    const eaveTrimLength = length; // Matches sidewall length
    gutterOutput = `- Eave Trim: ${eaveTrimPieces} @ ${toFeetAndInches(eaveTrimLength)} each`;
  } else {
    // Gutters: 1 per sidewall
    const gutterPieces = 2; // 2 sidewalls
    const gutterLength = length; // Matches sidewall length
    // Gutter Straps: Length / 2
    const gutterStrapsPerGutter = Math.floor(gutterLength / 2);
    const totalGutterStraps = gutterStrapsPerGutter * gutterPieces;
    // Downspouts: 1 every 20'
    const downspoutsPerGutter = Math.ceil(gutterLength / 20);
    const totalDownspouts = downspoutsPerGutter * gutterPieces;
    const downspoutLength = height; // From eave to ground
    // Downspout Kickouts: 1 per downspout
    const totalKickouts = totalDownspouts;
    // Downspout Straps: 2 per downspout
    const totalDownspoutStraps = totalDownspouts * 2;
    // Gutter Endcap Pairs: 1 per side with gutters
    const gutterEndcapPairs = gutterPieces;
    // Corner Box Pairs: 1 per side with gutters
    const cornerBoxPairs = gutterPieces;

    gutterOutput = `
- Gutters: ${gutterPieces} @ ${toFeetAndInches(gutterLength)} each
- Gutter Straps: ${totalGutterStraps}
- Downspouts: ${totalDownspouts} @ ${toFeetAndInches(downspoutLength)} each
- Downspout Kickouts: ${totalKickouts}
- Downspout Straps: ${totalDownspoutStraps}
- Gutter Endcap Pairs: ${gutterEndcapPairs}
- Corner Box Pairs: ${cornerBoxPairs}`;
  }

  // Doors and windows adjustments
  let manDoorHeaderPurlins = 0;
  let windowFramingPurlins = 0;
  let doorJambs: any[] = [];
  let headerTrim: { [key: number]: number } = {};
  let doorJambCasing: { [key: number]: number } = {};

  manDoors.forEach(door => {
    const width = door.width;
    manDoorHeaderPurlins += 1; // One purlin across the top, spanning the bay

    // Man door header trim: 1 piece at 11', 1 piece at 8'
    headerTrim[11] = (headerTrim[11] || 0) + 1; // 11' for header + one jamb
    headerTrim[8] = (headerTrim[8] || 0) + 1;  // 8' for the other jamb
  });

  let squareTubingForRollUpDoors: { width: number, height: number, length: number }[] = [];

  rollUpDoors.forEach((door, index) => {
    const doorWidth = door.width;
    const doorHeight = door.height;
    let startPos = 0, endPos = 0;
    let isOnGableWall = false;
    
    if (index === 0 && rollUpDoorsFront.length >= 1) {
      startPos = rollUpDoorsFront[0].start || 0;
      endPos = rollUpDoorsFront[0].end || doorWidth;
      isOnGableWall = true;
    } else if (index === 1 && rollUpDoorsFront.length >= 2) {
      startPos = rollUpDoorsFront[1].start || 0;
      endPos = rollUpDoorsFront[1].end || doorWidth;
      isOnGableWall = true;
    } else if (rollUpDoorsBack.length > 0) {
      const backDoorIndex = index - rollUpDoorsFront.length;
      if (backDoorIndex >= 0 && backDoorIndex < rollUpDoorsBack.length) {
        startPos = rollUpDoorsBack[backDoorIndex].start || 0;
        endPos = rollUpDoorsBack[backDoorIndex].end || doorWidth;
        isOnGableWall = true;
      } else {
        // Door is on a side wall
        isOnGableWall = false;
      }
    }

    // Calculate height for the square tubing
    let tubingLength;
    if (isOnGableWall) {
      // For doors on gable walls, calculate height at door edges for jambs
      const heightAtStart = height + Math.min(startPos, width - startPos) * slopePerFoot;
      const heightAtEnd = height + Math.min(endPos, width - endPos) * slopePerFoot;
      // Use the maximum height for tubing to reach the roof line
      tubingLength = Math.max(heightAtStart, heightAtEnd);
    } else {
      // For doors on side walls, use eave height
      tubingLength = height;
    }
    
    // Add two square tubing pieces for each roll-up door (one for each side)
    squareTubingForRollUpDoors.push({ width: doorWidth, height: doorHeight, length: tubingLength });
    squareTubingForRollUpDoors.push({ width: doorWidth, height: doorHeight, length: tubingLength });

    // Rest of the existing door calculations...
    let startPosDoor = 0, endPosDoor = 0;
    
    if (index === 0 && rollUpDoorsFront.length >= 1) {
      startPosDoor = rollUpDoorsFront[0].start || 0;
      endPosDoor = rollUpDoorsFront[0].end || doorWidth;
    } else if (index === 1 && rollUpDoorsFront.length >= 2) {
      startPosDoor = rollUpDoorsFront[1].start || 0;
      endPosDoor = rollUpDoorsFront[1].end || doorWidth;
    } else if (rollUpDoorsBack.length > 0) {
      const backDoorIndex = index - rollUpDoorsFront.length;
      if (backDoorIndex >= 0 && backDoorIndex < rollUpDoorsBack.length) {
        startPosDoor = rollUpDoorsBack[backDoorIndex].start || 0;
        endPosDoor = rollUpDoorsBack[backDoorIndex].end || doorWidth;
      }
    }

    // Calculate height at door edges for jambs
    const heightAtStart = height + Math.min(startPosDoor, width - startPosDoor) * slopePerFoot;
    const heightAtEnd = height + Math.min(endPosDoor, width - endPosDoor) * slopePerFoot;
    const jambHeight = (heightAtStart + heightAtEnd) / 2;
    doorJambs.push({ width: doorWidth, height: jambHeight });

    // Roll-up door header trim: 1 piece at width + 1', 2 pieces at height + 1'
    const headerTrimLength = doorWidth + 1;
    const jambTrimLength = doorHeight + 1;
    headerTrim[headerTrimLength] = (headerTrim[headerTrimLength] || 0) + 1; // Header trim
    headerTrim[jambTrimLength] = (headerTrim[jambTrimLength] || 0) + 2;   // Two jamb pieces

    // Roll-up door 4" jamb casing: 1 piece at header trim length, 2 pieces at jamb trim length
    doorJambCasing[headerTrimLength] = (doorJambCasing[headerTrimLength] || 0) + 1; // 1 piece matching header trim
    doorJambCasing[jambTrimLength] = (doorJambCasing[jambTrimLength] || 0) + 2;     // 2 pieces matching jamb trim
  });

  windows.forEach(window => {
    windowFramingPurlins += 2; // 2 purlins per window (top and bottom)

    // Window header trim: 2 pieces at (width + height + 1')
    const windowWidth = window.width;
    const windowHeight = window.height;
    const windowTrimLength = windowWidth + windowHeight + 1;
    headerTrim[windowTrimLength] = (headerTrim[windowTrimLength] || 0) + 2; // Two pieces per window
  });

  // Awnings
  let awningFrames = 0;
  awnings.forEach(() => {
    awningFrames += 3; // Two sides and one front frame per awning
  });
  // TEK Screws for fastening panels to purlins/girts
  // Calculate TEK screws based on actual sloped roof area (length * slopeLengthPerSide * 2 sides)
  const tekScrewsRoof = Math.ceil(length * totalPurlinLines * (slopeLengthPerSide / (width / 2))); // Adjust by slope factor
  const sidewallFasteningPoints = 4; // Base angle, 5' girt, 10' girt, eave strut
  const tekScrewsSidewall = length * sidewallFasteningPoints; // Span = building length (40'), fastening points = 4 (base angle, 5', 10', eave strut)
  const totalWallTekScrews = tekScrewsSidewall;
  const tekScrewsTrim = 250; // Additional TEK screws for trim
  const tekScrewsRoofOutput = `- #12 x 1-1/4" Hex Washer Head TEK Screws (Roof): ${tekScrewsRoof} (for roof panel-to-purlin fastening)`;
  const tekScrewsWallOutput = `- #12 x 1-1/4" Hex Washer Head TEK Screws (Walls): ${totalWallTekScrews} (for wall panel-to-girt fastening; sidewalls fastened to base angle, 5' girt, 10' girt, eave strut)`;
  const tekScrewsTrimOutput = `- #12 x 1-1/4" Hex Washer Head TEK Screws (Trim): ${tekScrewsTrim} (for trim fastening)`;

  // LAP Screws for fastening panel sidelaps
  const lapScrewsRoof = (roofPanels * totalPurlinLines) * 2; // 28 panels × 10 purlins × 2
  const lapScrewsSidewall = (totalSideWallPanels * (wallGirtsPerSideHeightSidewall * 2)) * 2; // 28 panels × 4 girts × 2 = 224 screws
  const totalWallLapScrews = lapScrewsSidewall;
  const lapScrewsTrim = 250; // Additional LAP screws for trim
  const lapScrewsRoofOutput = `- #10 x 7/8" Hex Washer Head LAP Screws with Bonded Sealing Washer (Roof): ${lapScrewsRoof} (for roof panel sidelaps)`;
  const lapScrewsWallOutput = `- #10 x 7/8" Hex Washer Head LAP Screws with Bonded Sealing Washer (Walls): ${totalWallLapScrews} (for wall panel sidelaps)`;
  const lapScrewsTrimOutput = `- #10 x 7/8" Hex Washer Head LAP Screws with Bonded Sealing Washer (Trim): ${lapScrewsTrim} (for trim fastening)`;

  // Philips Head Pancake Screws for window and window header trim installation
  const screwsPerWindow = 24; // 24 screws per window
  const totalWindowScrews = windows.length * screwsPerWindow; // Total screws for all windows
  const windowScrewsOutput = `- #10 x 1" Philips Head Pancake Screws: ${totalWindowScrews} (for window and window header trim installation)`;

  // Concrete Drive-In Anchors for base angle on the ground
  const anchorsPerFoot = 1 / 3; // 1 anchor per 3 feet
  const totalBaseAngleOnGround = baseAnglePerimeterLength; // Adjusted to 124' after excluding roll-up door areas
  const totalAnchors = Math.ceil(totalBaseAngleOnGround * anchorsPerFoot); // 124' / 3 ≈ 41.33 → 42 anchors
  const concreteAnchorsOutput = `- 2" x 1/4" Concrete Drive-In Anchors: ${totalAnchors} (for securing base angle to foundation; 1 per 3'; excludes roll-up door areas)`;

  // Format header trim output
  let headerTrimOutput = '';
  const sortedTrimLengths = Object.keys(headerTrim).sort((a, b) => Number(a) - Number(b));
  sortedTrimLengths.forEach(length => {
    const count = headerTrim[Number(length)];
    headerTrimOutput += `- Header Trim: ${count} @ ${toFeetAndInches(parseFloat(length))} each\n`;
  });

  // Format door jamb casing output
  let doorJambCasingOutput = '';
  const sortedCasingLengths = Object.keys(doorJambCasing).sort((a, b) => Number(a) - Number(b));
  sortedCasingLengths.forEach(length => {
    const count = doorJambCasing[Number(length)];
    doorJambCasingOutput += `- 4" Door Jamb Casing: ${count} @ ${toFeetAndInches(parseFloat(length))} each\n`;
  });

  // Format wall panels output
  const sideWallPanelsOutput = `- Side Wall Panels: ${totalSideWallPanels} @ ${toFeetAndInches(height)} each`;
  
  // Gabled end wall panels (front and back), no reductions
  const gabledEndPanelsOutput = `
- Gabled End Wall Panels (Front): Total ${sideWallPanelsPerWall}
  Heights: ${gabledEndPanelHeightsFormatted.join(', ')}
- Gabled End Wall Panels (Back): Total ${sideWallPanelsPerWall}
  Heights: ${gabledEndPanelHeightsFormatted.join(', ')}`;

  // Format door jambs output
  let doorJambsOutput = doorJambs.map(jamb => 
    `- Door Jambs (Square Tubing) for ${jamb.width}'x10' Roll-Up Door: 2 @ ${toFeetAndInches(jamb.height)} each`
  ).join('\n');

  // Format square tubing output
  let squareTubingOutput = '';
  if (squareTubingForRollUpDoors.length > 0) {
    const groupedByLength = squareTubingForRollUpDoors.reduce((acc, tubing) => {
      const lengthKey = tubing.length.toFixed(2);
      if (!acc[lengthKey]) {
        acc[lengthKey] = { count: 0, length: tubing.length };
      }
      acc[lengthKey].count += 1;
      return acc;
    }, {} as Record<string, { count: number, length: number }>);
    
    squareTubingOutput = Object.values(groupedByLength)
      .map(group => `- 4"x4"x14 Gauge Square Tubing: ${group.count} @ ${toFeetAndInches(group.length)} each (for roll-up door jambs)`)
      .join('\n');
  }

  const weldedTabsOutput = weldedTabsNeeded > 0 ? 
    `- Welded Tabs for Girt Terminations: ${weldedTabsNeeded} (for securing girts to roll-up door jambs)` : '';

  return `
MATERIAL TAKEOFF

// STRUCTURAL:
${data.structuralFrames ? generateStructuralDetails(data.structuralFrames, totalColumnsWithCenters, totalRafters, height, slopeLengthPerSide) : `- Columns (I-beams): ${totalColumnsWithCenters} @ ${toFeetAndInches(height)} each
- Rafters (I-beams): ${totalRafters} @ ${toFeetAndInches(slopeLengthPerSide)} each`}
- Roof Purlins: ${totalPurlinPieces} @ ${toFeetAndInches(purlinLength)} each (${purlinsPerSide} purlins per roof side, based on slope length of ${toFeetAndInches(slopeLengthPerSide)})
- Wall Girts: ${totalGirtPieces} @ ${toFeetAndInches(girtLength)} each
${baseAnglePerimeterOutput}
${baseAngleGabledOutput}
- Man Door Header Purlins: ${manDoorHeaderPurlins} @ ${toFeetAndInches(bayLength)} each
- Window Framing Purlins: ${windowFramingPurlins} @ ${toFeetAndInches(bayLength)} each

// PANELING:
- Roof Panels (${panelType || 'R-Panel'}): ${roofPanels} @ ${toFeetAndInches(roofPanelLength)} each
${sideWallPanelsOutput}${gabledEndPanelsOutput}
${panelClosuresOutput}

// TRIM:
${ridgeRollOutput}
${peakBoxesOutput}
${rakeTrimOutput}
${cornerTrimOutput}${dripFlashingOutput}${gutterOutput}
${headerTrimOutput}${doorJambsOutput}

// DOORS AND WINDOWS:
- Man Doors: ${manDoors.length}
- Roll-Up Doors: ${rollUpDoors.length}
- Windows: ${windows.length}
- Awnings: ${awnings.length}
- Awning Frames: ${awningFrames} @ varying lengths

// ACCESSORIES:
${squareTubingOutput}
${weldedTabsOutput}
${doorJambCasingOutput}
${Object.keys(girtClipsBySize).sort().map(size => `- Girt Clips (${size}): ${girtClipsBySize[size]} (clips used to attach ${size} girts to columns; count rounded to nearest even number)`).join('\n')}

// FASTENERS:
${tekScrewsRoofOutput}
${tekScrewsWallOutput}
${tekScrewsTrimOutput}
${lapScrewsRoofOutput}
${lapScrewsWallOutput}
${lapScrewsTrimOutput}
${windowScrewsOutput}
${concreteAnchorsOutput}
`;
}