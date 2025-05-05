import React, { useEffect } from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';

interface InsulationOptionsProps {
  data: {
    enabled: boolean;
    type: 'spray' | 'batt';
  };
  updateField: (field: string, value: any) => void;
  buildingData: {
    length: number;
    width: number;
    height: number;
    roofType: string;
    roofPitch: number;
    walls: any;
  };
}

const InsulationOptions: React.FC<InsulationOptionsProps> = ({ 
  data, 
  updateField,
  buildingData
}) => {
  // Update nested insulation fields
  const updateInsulationField = (field: string, value: any) => {
    updateField('insulation', {
      ...data,
      [field]: value
    });
  };
  
  // Effect to update subtractInsulation defaults when insulation type changes
  useEffect(() => {
    if (!data.enabled) return;
    
    // Get the updated walls structure
    const updatedWalls = JSON.parse(JSON.stringify(buildingData.walls));
    let hasChanges = false;
    
    // For each wall, update the subtractInsulation property based on insulation type
    Object.keys(updatedWalls).forEach(wallKey => {
      const wall = updatedWalls[wallKey];
      
      // Set doors based on insulation type
      if (wall.doors && Array.isArray(wall.doors)) {
        wall.doors.forEach(door => {
          if (door.subtractInsulation === undefined) {
            door.subtractInsulation = data.type === 'spray';
            hasChanges = true;
          }
        });
      }
      
      // Set windows based on insulation type
      if (wall.windows && Array.isArray(wall.windows)) {
        wall.windows.forEach(window => {
          if (window.subtractInsulation === undefined) {
            window.subtractInsulation = data.type === 'spray';
            hasChanges = true;
          }
        });
      }
      
      // Bay doors and openings are always true by default
      if (wall.bayDoors && Array.isArray(wall.bayDoors)) {
        wall.bayDoors.forEach(door => {
          if (door.subtractInsulation === undefined) {
            door.subtractInsulation = true;
            hasChanges = true;
          }
        });
      }
      
      if (wall.openings && Array.isArray(wall.openings)) {
        wall.openings.forEach(opening => {
          if (opening.subtractInsulation === undefined) {
            opening.subtractInsulation = true;
            hasChanges = true;
          }
        });
      }
    });
    
    // Only update if changes were made
    if (hasChanges) {
      updateField('walls', updatedWalls);
    }
  }, [data.enabled, data.type]);
  
  // Calculate wall area for all walls with safe property access
  const calculateWallArea = () => {
    const { length, width, height } = buildingData;
    const northSouthWallArea = length * height * 2;
    const eastWestWallArea = width * height * 2;
    
    let totalWallArea = northSouthWallArea + eastWestWallArea;
    
    // Safely access wall properties
    try {
      if (buildingData.walls) {
        Object.values(buildingData.walls).forEach((wall: any) => {
          // Safely handle doors
          if (wall.doors && Array.isArray(wall.doors)) {
            wall.doors.forEach((door: any) => {
              // Only subtract if subtractInsulation is true
              if (door && door.subtractInsulation && door.dimensions && typeof door.dimensions === 'string') {
                try {
                  const dimensions = door.dimensions.split('x');
                  if (dimensions.length === 2) {
                    const doorWidth = parseFloat(dimensions[0]);
                    const doorHeight = parseFloat(dimensions[1]);
                    if (!isNaN(doorWidth) && !isNaN(doorHeight)) {
                      totalWallArea -= doorWidth * doorHeight;
                    }
                  }
                } catch (e) {
                  console.warn('Error processing door dimensions:', e);
                }
              }
            });
          }
          
          // Safely handle windows
          if (wall.windows && Array.isArray(wall.windows)) {
            wall.windows.forEach((window: any) => {
              // Only subtract if subtractInsulation is true
              if (window && window.subtractInsulation && window.dimensions && typeof window.dimensions === 'string') {
                try {
                  const dimensions = window.dimensions.split('x');
                  if (dimensions.length === 2) {
                    const windowWidth = parseFloat(dimensions[0]);
                    const windowHeight = parseFloat(dimensions[1]);
                    if (!isNaN(windowWidth) && !isNaN(windowHeight)) {
                      totalWallArea -= windowWidth * windowHeight;
                    }
                  }
                } catch (e) {
                  console.warn('Error processing window dimensions:', e);
                }
              }
            });
          }
          
          // Safely handle bay doors
          if (wall.bayDoors && Array.isArray(wall.bayDoors)) {
            wall.bayDoors.forEach((door: any) => {
              // Only subtract if subtractInsulation is true
              if (door && door.subtractInsulation) {
                if (door.width && door.height) {
                  // Bay doors might store dimensions directly as numbers
                  const doorWidth = parseFloat(door.width);
                  const doorHeight = parseFloat(door.height);
                  if (!isNaN(doorWidth) && !isNaN(doorHeight)) {
                    totalWallArea -= doorWidth * doorHeight;
                  }
                } else if (door && door.dimensions && typeof door.dimensions === 'string') {
                  try {
                    const dimensions = door.dimensions.split('x');
                    if (dimensions.length === 2) {
                      const doorWidth = parseFloat(dimensions[0]);
                      const doorHeight = parseFloat(dimensions[1]);
                      if (!isNaN(doorWidth) && !isNaN(doorHeight)) {
                        totalWallArea -= doorWidth * doorHeight;
                      }
                    }
                  } catch (e) {
                    console.warn('Error processing bay door dimensions:', e);
                  }
                }
              }
            });
          }
          
          // Safely handle general openings
          if (wall.openings && Array.isArray(wall.openings)) {
            wall.openings.forEach((opening: any) => {
              // Only subtract if subtractInsulation is true
              if (opening && opening.subtractInsulation && 
                  typeof opening.width === 'number' && typeof opening.height === 'number') {
                totalWallArea -= opening.width * opening.height;
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error calculating wall area:', error);
      // Return the total wall area without subtracting openings if there was an error
    }
    
    return Math.max(0, totalWallArea); // Ensure we don't return negative area
  };
  
  // Calculate roof area (unchanged from previous implementation)
  const calculateRoofArea = () => {
    const { length, width, roofType, roofPitch = 3 } = buildingData;
    
    try {
      // For gable roof, calculate the actual roof surface area based on pitch
      if (roofType === 'gable') {
        const pitch = roofPitch / 12; // Convert to rise/run ratio
        const roofWidth = width / 2; // Half width for each side of gable
        const roofHeight = roofWidth * pitch; // Height of roof peak above wall
        const roofSlope = Math.sqrt(roofWidth * roofWidth + roofHeight * roofHeight); // Pythagorean theorem
        return length * roofSlope * 2; // Two sides of gable
      } else {
        // For single slope, similar calculation but with full width
        const pitch = roofPitch / 12;
        const roofHeight = width * pitch;
        const roofSlope = Math.sqrt(width * width + roofHeight * roofHeight);
        return length * roofSlope;
      }
    } catch (error) {
      console.error('Error calculating roof area:', error);
      // Fallback to a simpler calculation
      return length * width * 1.1; // Add 10% for pitch as a fallback
    }
  };
  
  // Calculate total insulation area
  const calculateTotalInsulationArea = () => {
    if (!data.enabled) return { walls: 0, roof: 0, total: 0 };
    
    try {
      const wallArea = calculateWallArea();
      const roofArea = calculateRoofArea();
      
      return {
        walls: Math.round(wallArea),
        roof: Math.round(roofArea),
        total: Math.round(wallArea + roofArea)
      };
    } catch (error) {
      console.error('Error calculating insulation area:', error);
      return { walls: 0, roof: 0, total: 0 };
    }
  };
  
  const insulationAreas = calculateTotalInsulationArea();
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <h4>Insulation</h4>
      </Card.Header>
      <Card.Body>
        <Form.Check 
          type="checkbox"
          id="insulation-enabled"
          label="Include Insulation"
          checked={data.enabled}
          onChange={(e) => updateInsulationField('enabled', e.target.checked)}
          className="mb-3"
        />
        
        {data.enabled && (
          <>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Insulation Type</Form.Label>
                  <Form.Select
                    value={data.type}
                    size="sm"
                    onChange={(e) => updateInsulationField('type', e.target.value)}
                  >
                    <option value="spray">Spray Foam</option>
                    <option value="batt">Batt Insulation</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    {data.type === 'spray' ? 
                      "Spray foam typically covers all surfaces, including around doors and windows." : 
                      "Batt insulation is typically installed between framing with gaps at doors and windows."}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="insulation-summary p-3 border rounded bg-light">
              <h6>Insulation Area Calculation</h6>
              <table className="table table-sm table-borderless mb-0">
                <tbody>
                  <tr>
                    <td>Wall Area:</td>
                    <td className="text-end">{insulationAreas.walls} sqft</td>
                  </tr>
                  <tr>
                    <td>Roof Area:</td>
                    <td className="text-end">{insulationAreas.roof} sqft</td>
                  </tr>
                  <tr className="fw-bold">
                    <td>Total Insulation:</td>
                    <td className="text-end">{insulationAreas.total} sqft</td>
                  </tr>
                </tbody>
              </table>
              <div className="text-muted small mt-2">
                Note: Calculation excludes area where "Subtract Insulation" is checked.
              </div>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default InsulationOptions;