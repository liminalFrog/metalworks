import React, { useState } from 'react';
import { Card, Form, Row, Col, Button, Nav, Tab, InputGroup } from 'react-bootstrap';

// Update interfaces to include new positioning options and lock flags
interface PositionConfig {
  centered: boolean;
  centerIn: string; // 'building', 'bay', 'objects'
  bay: string; // 'A', 'B', 'C', etc.
  distance: number;
  from: string; // 'left', 'right'
  edgeOf: string; // 'building', 'bay', 'object'
}

interface WallOptionsProps {
  data: {
    walls: {
      [key: string]: {
        girts: {
          size: string;
          sizeLocked: boolean;
          spacing: number;
          spacingLocked: boolean;
          maxGap: number;
          maxGapLocked: boolean;
        };
        doors: {
          dimensions: string;
          position: PositionConfig;
          subtractInsulation: boolean;
          id: string;
        }[];
        windows: {
          dimensions: string;
          sillHeight: number;
          position: PositionConfig;
          subtractInsulation: boolean;
          id: string;
        }[];
        bayDoors: {
          type: string;
          width: number;
          height: number;
          position: PositionConfig;
          subtractInsulation: boolean;
          id: string;
        }[];
        openings: {
          width: number;
          height: number;
          position: PositionConfig;
          subtractInsulation: boolean;
          id: string;
        }[];
        awning: {
          enabled: boolean;
          height: number;
          width: number;
          position: PositionConfig;
          spanWall: boolean;
          length: number;
          wraparound: string;
          pitch: number;
          postType: string;
        };
        roofExtension: {
          enabled: boolean;
          width: number;
          dropWalls: string;
          wallHeight: number;
        };
      };
    };
  };
  updateField: (field: string, value: any) => void;
  buildingWidth: number;
  buildingLength: number;
  buildingHeight: number;
  roofType: string;
  bays: number;
  insulation?: {
    enabled: boolean;
    type: 'spray' | 'batt';
  };
}

const defaultPosition: PositionConfig = {
  centered: true,
  centerIn: 'building',
  bay: 'A',
  distance: 5,
  from: 'left',
  edgeOf: 'building'
};

const WallOptions: React.FC<WallOptionsProps> = ({ 
  data, 
  updateField, 
  buildingWidth, 
  buildingLength,
  buildingHeight,
  roofType,
  bays,
  insulation = { enabled: false, type: 'batt' }
}) => {
  const [activeWall, setActiveWall] = useState('north');
  
  const doorSizes = ['2x6', '2x7', '2x8', '3x6', '3x7', '3x8', '4x7', '4x8'];
  const windowSizes = ['2x2', '2x3', '2x4', '3x2', '3x3', '3x4', '3x5', '4x3', '4x4', '4x5', '4x6', '5x4', '5x5', '6x4', '6x5', '6x6'];
  const pitchOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];
  
  const generateId = () => Math.random().toString(36).substring(2, 15);
  
  // Update the updateWallField function

  const updateWallField = (wall: string, field: string, value: any) => {
    // Create a deep clone of the walls object
    const updatedWalls = JSON.parse(JSON.stringify(data.walls));
    const path = field.split('.');
    
    let current = updatedWalls[wall];
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    updateField('walls', updatedWalls);
  };
  
  // Apply settings to all walls if not locked
  const applyToAllWalls = (sourceWall: string, field: string) => {
    const updatedWalls = { ...data.walls };
    const path = field.split('.');
    
    // Get the value from source wall
    let sourceValue = data.walls[sourceWall];
    for (let i = 0; i < path.length; i++) {
      sourceValue = sourceValue[path[i]];
    }
    
    // Determine the corresponding lock field name
    const lockFieldName = `${path[path.length-1]}Locked`;
    
    // Apply to other walls if not locked
    Object.keys(updatedWalls).forEach(wall => {
      if (wall !== sourceWall) {
        // Check if the target wall has this field locked
        let targetWall = updatedWalls[wall];
        
        // Navigate to the parent object of the field
        let parent = targetWall;
        for (let i = 0; i < path.length - 1; i++) {
          parent = parent[path[i]];
        }
        
        // Only update if not locked
        if (!parent[lockFieldName]) {
          parent[path[path.length - 1]] = sourceValue;
        }
      }
    });
    
    updateField('walls', updatedWalls);
  };
  
  const calculateGirtPositions = (height: number, spacing: number, maxGap: number) => {
    const positions: number[] = [];
    
    let currentHeight = spacing;
    while (currentHeight < height) {
      positions.push(currentHeight);
      currentHeight += spacing;
    }
    
    const lastGirtPos = positions.length > 0 ? positions[positions.length - 1] : 0;
    const gapToEave = height - lastGirtPos;
    
    if (gapToEave > maxGap && gapToEave < spacing) {
      positions.push(height - maxGap/2);
    }
    
    return positions;
  };
  
  const getBayOptions = () => {
    const options = [];
    for (let i = 0; i < bays; i++) {
      options.push({
        value: String.fromCharCode(65 + i), // A, B, C, etc.
        label: String.fromCharCode(65 + i)
      });
    }
    return options;
  };
  
  const addDoor = (wall: string) => {
    const updatedWalls = JSON.parse(JSON.stringify(data.walls)); // Deep clone
    updatedWalls[wall].doors.push({
      dimensions: '3x7',
      position: { 
        centered: true,
        centerIn: 'building',
        bay: 'A',
        distance: 5,
        from: 'left',
        edgeOf: 'building'
      },
      subtractInsulation: insulation.type === 'spray',
      id: generateId()
    });
    updateField('walls', updatedWalls);
  };
  
  const removeDoor = (wall: string, index: number) => {
    const updatedWalls = { ...data.walls };
    updatedWalls[wall].doors.splice(index, 1);
    updateField('walls', updatedWalls);
  };
  
  const addWindow = (wall: string) => {
    const updatedWalls = JSON.parse(JSON.stringify(data.walls)); // Deep clone
    updatedWalls[wall].windows.push({
      dimensions: '3x3',
      sillHeight: 3,
      position: { 
        centered: true,
        centerIn: 'building',
        bay: 'A',
        distance: 5,
        from: 'left',
        edgeOf: 'building'
      },
      subtractInsulation: insulation.type === 'spray',
      id: generateId()
    });
    updateField('walls', updatedWalls);
  };
  
  const removeWindow = (wall: string, index: number) => {
    const updatedWalls = { ...data.walls };
    updatedWalls[wall].windows.splice(index, 1);
    updateField('walls', updatedWalls);
  };
  
  const addBayDoor = (wall: string) => {
    const updatedWalls = JSON.parse(JSON.stringify(data.walls)); // Deep clone
    updatedWalls[wall].bayDoors.push({
      type: 'roll-up',
      width: 10,
      height: 10,
      position: { 
        centered: true,
        centerIn: 'building',
        bay: 'A',
        distance: 5,
        from: 'left',
        edgeOf: 'building'
      },
      subtractInsulation: true,
      id: generateId()
    });
    updateField('walls', updatedWalls);
  };
  
  const removeBayDoor = (wall: string, index: number) => {
    const updatedWalls = { ...data.walls };
    updatedWalls[wall].bayDoors.splice(index, 1);
    updateField('walls', updatedWalls);
  };
  
  const addOpening = (wall: string) => {
    const updatedWalls = JSON.parse(JSON.stringify(data.walls)); // Deep clone
    updatedWalls[wall].openings.push({
      width: 4,
      height: 4,
      position: { 
        centered: true,
        centerIn: 'building',
        bay: 'A',
        distance: 5,
        from: 'left',
        edgeOf: 'building'
      },
      subtractInsulation: true,
      id: generateId()
    });
    updateField('walls', updatedWalls);
  };
  
  const removeOpening = (wall: string, index: number) => {
    const updatedWalls = { ...data.walls };
    updatedWalls[wall].openings.splice(index, 1);
    updateField('walls', updatedWalls);
  };

  const updateSubtractInsulation = (wall: string, elementType: string, index: number, value: boolean) => {
    const updatedWalls = JSON.parse(JSON.stringify(data.walls));
    updatedWalls[wall][elementType][index].subtractInsulation = value;
    updateField('walls', updatedWalls);
  };
  
  const updateDoor = (wall: string, index: number, field: string, value: any) => {
    const updatedWalls = { ...data.walls };
    const path = field.split('.');
    
    if (path.length === 1) {
      updatedWalls[wall].doors[index][path[0]] = value;
    } else {
      let current = updatedWalls[wall].doors[index];
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
    }
    
    updateField('walls', updatedWalls);
  };
  
  const updateWindow = (wall: string, index: number, field: string, value: any) => {
    const updatedWalls = { ...data.walls };
    const path = field.split('.');
    
    if (path.length === 1) {
      updatedWalls[wall].windows[index][path[0]] = value;
    } else {
      let current = updatedWalls[wall].windows[index];
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
    }
    
    updateField('walls', updatedWalls);
  };
  
  const updateBayDoor = (wall: string, index: number, field: string, value: any) => {
    const updatedWalls = { ...data.walls };
    const path = field.split('.');
    
    if (path.length === 1) {
      updatedWalls[wall].bayDoors[index][path[0]] = value;
    } else {
      let current = updatedWalls[wall].bayDoors[index];
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
    }
    
    updateField('walls', updatedWalls);
  };
  
  const updateOpening = (wall: string, index: number, field: string, value: any) => {
    const updatedWalls = { ...data.walls };
    const path = field.split('.');
    
    if (path.length === 1) {
      updatedWalls[wall].openings[index][path[0]] = value;
    } else {
      let current = updatedWalls[wall].openings[index];
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
    }
    
    updateField('walls', updatedWalls);
  };
  
  const getMaxDistance = (wall: string) => {
    if (wall === 'north' || wall === 'south') {
      return buildingWidth;
    } else {
      return buildingLength;
    }
  };

  const isGableWall = (wall: string) => {
    return roofType === 'gable' && (wall === 'north' || wall === 'south');
  };

  // Reusable positioning component
  const PositioningOptions = ({ 
    position, 
    onChange, 
    wall 
  }: { 
    position: PositionConfig, 
    onChange: (field: string, value: any) => void,
    wall: string
  }) => (
    <div className="positioning-options">
      <Form.Check
        type="checkbox"
        id={`centered-${Math.random().toString(36).substring(2, 7)}`}
        label="Centered"
        className="mb-2"
        checked={position.centered}
        onChange={(e) => onChange('centered', e.target.checked)}
      />
      
      {position.centered ? (
        <Form.Group className="mb-3">
          <Form.Label>Center in</Form.Label>
          <Form.Select
            size="sm"
            value={position.centerIn}
            onChange={(e) => onChange('centerIn', e.target.value)}
          >
            <option value="building">Building</option>
            <option value="bay">Bay</option>
            <option value="objects">Between Objects</option>
          </Form.Select>
          
          {position.centerIn === 'bay' && (
            
            <Form.Group className="mt-2">
              <Form.Label>Select Bay</Form.Label>
              <Form.Select
                size="sm"
                value={position.bay}
                onChange={(e) => onChange('bay', e.target.value)}
              >
                {getBayOptions().map(bay => (
                  <option key={bay.value} value={bay.value}>{bay.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
        </Form.Group>
      ) : (
        <div>
          <Form.Group className="mb-2">
            <Form.Label>Distance (ft)</Form.Label>
            <Form.Control
              type="number"
              min={0}
              max={getMaxDistance(wall)}
              step={0.5}
              size="sm"
              value={position.distance}
              onChange={(e) => onChange('distance', parseFloat(e.target.value))}
            />
          </Form.Group>
          
          <Row className="mb-3">
            <Col xs={6}>
              <Form.Group>
                <Form.Label>From</Form.Label>
                <Form.Select
                  size="sm"
                  value={position.from}
                  onChange={(e) => onChange('from', e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group>
                <Form.Label>Edge of</Form.Label>
                <Form.Select
                  size="sm"
                  value={position.edgeOf}
                  onChange={(e) => onChange('edgeOf', e.target.value)}
                >
                  <option value="building">Building</option>
                  <option value="bay">Bay</option>
                  <option value="object">Nearest Object</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          {position.edgeOf === 'bay' && (
            <Form.Group className="mb-3">
              <Form.Label>Select Bay</Form.Label>
              <Form.Select
                size="sm"
                value={position.bay}
                onChange={(e) => onChange('bay', e.target.value)}
              >
                {getBayOptions().map(bay => (
                  <option key={bay.value} value={bay.value}>{bay.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
        </div>
      )}
    </div>
  );
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <h4>Wall Options</h4>
      </Card.Header>
      <Card.Body>
        <Tab.Container activeKey={activeWall} onSelect={(k) => setActiveWall(k || 'north')}>
          <Row className="mb-3">
            <Col>
              <Nav variant="tabs">
                <Nav.Item>
                  <Nav.Link eventKey="north">North</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="east">East</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="south">South</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="west">West</Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
          </Row>
          
          <Tab.Content>
            {Object.entries(data.walls).map(([wall, wallData]) => (
              <Tab.Pane key={wall} eventKey={wall}>
                {/* Girts Section with enhanced controls */}
                <Card className="mb-3">
                  <Card.Header>
                    <h5>Girts (Purlins)</h5>
                  </Card.Header>
                  <Card.Body>
                    {/* Girt Size with Apply to All and Lock */}
                    <Row className="mb-3 align-items-end">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Size</Form.Label>
                          <Form.Select
                            value={wallData.girts.size}
                            size="sm"
                            onChange={(e) => updateWallField(wall, 'girts.size', e.target.value)}
                          >
                            <option value="C2x4">C2x4</option>
                            <option value="C2x6">C2x6</option>
                            <option value="C2x8">C2x8</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Button 
                          size="sm" 
                          variant="outline-secondary"
                          onClick={() => applyToAllWalls(wall, 'girts.size')}
                        >
                          Apply to All Walls
                        </Button>
                      </Col>
                      <Col md={2}>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`lock-girt-size-${wall}`}
                            checked={wallData.girts.sizeLocked}
                            onChange={(e) => updateWallField(wall, 'girts.sizeLocked', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor={`lock-girt-size-${wall}`}>
                            Lock
                          </label>
                        </div>
                      </Col>
                    </Row>
                    
                    {/* Girt Spacing with Apply to All and Lock */}
                    <Row className="mb-3 align-items-end">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Spacing (ft)</Form.Label>
                          <Form.Control
                            type="number"
                            min={1}
                            max={10}
                            step={0.5}
                            value={wallData.girts.spacing}
                            size="sm"
                            onChange={(e) => updateWallField(wall, 'girts.spacing', parseFloat(e.target.value))}
                          />
                          <Form.Text className="text-muted">
                            Distance between each girt
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Button 
                          size="sm" 
                          variant="outline-secondary"
                          onClick={() => applyToAllWalls(wall, 'girts.spacing')}
                        >
                          Apply to All Walls
                        </Button>
                      </Col>
                      <Col md={2}>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`lock-girt-spacing-${wall}`}
                            checked={wallData.girts.spacingLocked}
                            onChange={(e) => updateWallField(wall, 'girts.spacingLocked', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor={`lock-girt-spacing-${wall}`}>
                            Lock
                          </label>
                        </div>
                      </Col>
                    </Row>
                    
                    {/* Max Gap with Apply to All and Lock */}
                    <Row className="mb-3 align-items-end">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Max Gap (ft)</Form.Label>
                          <Form.Control
                            type="number"
                            min={1}
                            max={10}
                            step={0.5}
                            value={wallData.girts.maxGap}
                            size="sm"
                            onChange={(e) => updateWallField(wall, 'girts.maxGap', parseFloat(e.target.value))}
                          />
                          <Form.Text className="text-muted">
                            Maximum acceptable gap between top girt and eave
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Button 
                          size="sm" 
                          variant="outline-secondary"
                          onClick={() => applyToAllWalls(wall, 'girts.maxGap')}
                        >
                          Apply to All Walls
                        </Button>
                      </Col>
                      <Col md={2}>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`lock-girt-maxgap-${wall}`}
                            checked={wallData.girts.maxGapLocked}
                            onChange={(e) => updateWallField(wall, 'girts.maxGapLocked', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor={`lock-girt-maxgap-${wall}`}>
                            Lock
                          </label>
                        </div>
                      </Col>
                    </Row>
                    
                    {/* Girt Position Preview */}
                    <Row>
                      <Col>
                        <div className="girt-preview p-2 border rounded bg-light">
                          <strong>Girt Positions: </strong>
                          {calculateGirtPositions(buildingHeight, wallData.girts.spacing, wallData.girts.maxGap)
                            .map(pos => pos.toFixed(1))
                            .join(', ')} ft
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
                
                {/* Rest of your existing wall options components... */}
                {/* Walk Doors Section */}
                <Card className="mb-3">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5>Walk Doors</h5>
                    <Button size="sm" variant="primary" onClick={() => addDoor(wall)}>
                      Add Door
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {wallData.doors.map((door, index) => (
                      <Card key={door.id} className="mb-3 position-card">
                        <Card.Body>
                          <Row className="mb-3 align-items-end">
                            <Col md={8}>
                              <Form.Group>
                                <Form.Label>Dimensions</Form.Label>
                                <Form.Select
                                  value={door.dimensions}
                                  size="sm"
                                  onChange={(e) => updateDoor(wall, index, 'dimensions', e.target.value)}
                                >
                                  {doorSizes.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={4} className="d-flex justify-content-end">
                              <Button size="sm" variant="danger" onClick={() => removeDoor(wall, index)}>
                                Remove
                              </Button>
                            </Col>
                          </Row>
                          
                          <Form.Check 
                            type="checkbox"
                            id={`door-${wall}-${index}-subtract-insulation`}
                            label="Subtract from Insulation"
                            checked={door.subtractInsulation || false}
                            onChange={(e) => updateSubtractInsulation(wall, 'doors', index, e.target.checked)}
                            className="mt-2"
                          />
                          
                          <hr />
                          <h6>Positioning</h6>
                          <PositioningOptions 
                            position={door.position} 
                            onChange={(field, value) => updateDoor(wall, index, `position.${field}`, value)}
                            wall={wall}
                          />
                        </Card.Body>
                      </Card>
                    ))}
                    {wallData.doors.length === 0 && (
                      <div className="text-center text-muted">No doors added</div>
                    )}
                  </Card.Body>
                </Card>

                {/* Windows Section */}
                <Card className="mb-3">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5>Windows</h5>
                    <Button size="sm" variant="primary" onClick={() => addWindow(wall)}>
                      Add Window
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {wallData.windows.map((window, index) => (
                      <Card key={window.id} className="mb-3 position-card">
                        <Card.Body>
                          <Row className="mb-3 align-items-end">
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>Dimensions</Form.Label>
                                <Form.Select
                                  value={window.dimensions}
                                  size="sm"
                                  onChange={(e) => updateWindow(wall, index, 'dimensions', e.target.value)}
                                >
                                  {windowSizes.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>Sill Height (ft)</Form.Label>
                                <Form.Control
                                  type="number"
                                  min={0}
                                  max={buildingHeight - 1}
                                  step={0.5}
                                  value={window.sillHeight}
                                  size="sm"
                                  onChange={(e) => updateWindow(wall, index, 'sillHeight', parseFloat(e.target.value))}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          
                          <Form.Check 
                            type="checkbox"
                            id={`window-${wall}-${index}-subtract-insulation`}
                            label="Subtract from Insulation"
                            checked={window.subtractInsulation || false}
                            onChange={(e) => updateSubtractInsulation(wall, 'windows', index, e.target.checked)}
                            className="mt-2"
                          />
                          
                          <Row>
                            <Col className="d-flex justify-content-end">
                              <Button size="sm" variant="danger" onClick={() => removeWindow(wall, index)}>
                                Remove
                              </Button>
                            </Col>
                          </Row>
                          
                          <hr />
                          <h6>Positioning</h6>
                          <PositioningOptions 
                            position={window.position} 
                            onChange={(field, value) => updateWindow(wall, index, `position.${field}`, value)}
                            wall={wall}
                          />
                        </Card.Body>
                      </Card>
                    ))}
                    {wallData.windows.length === 0 && (
                      <div className="text-center text-muted">No windows added</div>
                    )}
                  </Card.Body>
                </Card>

                {/* Bay Doors Section */}
                <Card className="mb-3">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5>Bay Doors</h5>
                    <Button size="sm" variant="primary" onClick={() => addBayDoor(wall)}>
                      Add Bay Door
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {wallData.bayDoors.map((door, index) => (
                      <Card key={door.id} className="mb-3 position-card">
                        <Card.Body>
                          <Row className="mb-3 align-items-end">
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label>Type</Form.Label>
                                <Form.Select
                                  value={door.type}
                                  size="sm"
                                  onChange={(e) => updateBayDoor(wall, index, 'type', e.target.value)}
                                >
                                  <option value="roll-up">Roll-up</option>
                                  <option value="track">Track</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label>Width (ft)</Form.Label>
                                <Form.Control
                                  type="number"
                                  min={6}
                                  max={20}
                                  step={1}
                                  value={door.width}
                                  size="sm"
                                  onChange={(e) => updateBayDoor(wall, index, 'width', parseFloat(e.target.value))}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label>Height (ft)</Form.Label>
                                <Form.Control
                                  type="number"
                                  min={6}
                                  max={14}
                                  step={1}
                                  value={door.height}
                                  size="sm"
                                  onChange={(e) => updateBayDoor(wall, index, 'height', parseFloat(e.target.value))}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          
                          <Row>
                            <Col className="d-flex justify-content-end">
                              <Button size="sm" variant="danger" onClick={() => removeBayDoor(wall, index)}>
                                Remove
                              </Button>
                            </Col>
                          </Row>
                          
                          <hr />
                          <h6>Positioning</h6>
                          <PositioningOptions 
                            position={door.position} 
                            onChange={(field, value) => updateBayDoor(wall, index, `position.${field}`, value)}
                            wall={wall}
                          />
                        </Card.Body>
                      </Card>
                    ))}
                    {wallData.bayDoors.length === 0 && (
                      <div className="text-center text-muted">No bay doors added</div>
                    )}
                  </Card.Body>
                </Card>

                {/* Openings Section */}
                <Card className="mb-3">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5>Openings</h5>
                    <Button size="sm" variant="primary" onClick={() => addOpening(wall)}>
                      Add Opening
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {wallData.openings.map((opening, index) => (
                      <Card key={opening.id} className="mb-3 position-card">
                        <Card.Body>
                          <Row className="mb-3 align-items-end">
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>Width (ft)</Form.Label>
                                <Form.Control
                                  type="number"
                                  min={1}
                                  max={20}
                                  step={0.5}
                                  value={opening.width}
                                  size="sm"
                                  onChange={(e) => updateOpening(wall, index, 'width', parseFloat(e.target.value))}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>Height (ft)</Form.Label>
                                <Form.Control
                                  type="number"
                                  min={1}
                                  max={buildingHeight}
                                  step={0.5}
                                  value={opening.height}
                                  size="sm"
                                  onChange={(e) => updateOpening(wall, index, 'height', parseFloat(e.target.value))}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          
                          <Form.Check 
                            type="checkbox"
                            id={`opening-${wall}-${index}-subtract-insulation`}
                            label="Subtract from Insulation"
                            checked={opening.subtractInsulation || false}
                            onChange={(e) => updateSubtractInsulation(wall, 'openings', index, e.target.checked)}
                            className="mt-2"
                          />
                          
                          <Row>
                            <Col className="d-flex justify-content-end">
                              <Button size="sm" variant="danger" onClick={() => removeOpening(wall, index)}>
                                Remove
                              </Button>
                            </Col>
                          </Row>
                          
                          <hr />
                          <h6>Positioning</h6>
                          <PositioningOptions 
                            position={opening.position} 
                            onChange={(field, value) => updateOpening(wall, index, `position.${field}`, value)}
                            wall={wall}
                          />
                        </Card.Body>
                      </Card>
                    ))}
                    {wallData.openings.length === 0 && (
                      <div className="text-center text-muted">No openings added</div>
                    )}
                  </Card.Body>
                </Card>

                {/* Awning Section */}
                <Card className="mb-3">
                  <Card.Header>
                    <Form.Check
                      type="checkbox"
                      id={`awning-${wall}`}
                      label="Awning"
                      checked={wallData.awning.enabled}
                      onChange={(e) => updateWallField(wall, 'awning.enabled', e.target.checked)}
                    />
                  </Card.Header>
                  {wallData.awning.enabled && (
                    <Card.Body>
                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Height (ft)</Form.Label>
                            <Form.Control
                              type="number"
                              min={0}
                              max={buildingHeight}
                              step={0.5}
                              value={wallData.awning.height}
                              size="sm"
                              onChange={(e) => updateWallField(wall, 'awning.height', parseFloat(e.target.value))}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Width (ft)</Form.Label>
                            <Form.Control
                              type="number"
                              min={1}
                              max={getMaxDistance(wall)}
                              step={0.5}
                              value={wallData.awning.width}
                              size="sm"
                              onChange={(e) => updateWallField(wall, 'awning.width', parseFloat(e.target.value))}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Check
                        type="checkbox"
                        id={`span-wall-${wall}`}
                        label="Span Wall"
                        className="mb-3"
                        checked={wallData.awning.spanWall}
                        onChange={(e) => updateWallField(wall, 'awning.spanWall', e.target.checked)}
                      />
                      
                      {!wallData.awning.spanWall && (
                        <>
                          <hr />
                          <h6>Positioning</h6>
                          <PositioningOptions 
                            position={wallData.awning.position} 
                            onChange={(field, value) => updateWallField(wall, `awning.position.${field}`, value)}
                            wall={wall}
                          />
                        </>
                      )}
                      
                      <hr />
                      <Row className="mb-3">
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Wraparound</Form.Label>
                            <Form.Select
                              value={wallData.awning.wraparound}
                              size="sm"
                              onChange={(e) => updateWallField(wall, 'awning.wraparound', e.target.value)}
                            >
                              <option value="none">None</option>
                              <option value="left">Left Corner</option>
                              <option value="right">Right Corner</option>
                              <option value="both">Both Corners</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Roof Pitch (x:12)</Form.Label>
                            <Form.Select
                              value={wallData.awning.pitch}
                              size="sm"
                              onChange={(e) => updateWallField(wall, 'awning.pitch', parseFloat(e.target.value))}
                            >
                              {pitchOptions.map(pitch => (
                                <option key={pitch} value={pitch}>{pitch}:12</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group>
                        <Form.Label>Post Type</Form.Label>
                        <Form.Select
                          value={wallData.awning.postType}
                          size="sm"
                          onChange={(e) => updateWallField(wall, 'awning.postType', e.target.value)}
                        >
                          <option value="4x4x14ga">4x4x14ga sq. tubing</option>
                          <option value="4.5OD">4.5OD round</option>
                        </Form.Select>
                      </Form.Group>
                    </Card.Body>
                  )}
                </Card>

                {/* Roof Extension Section (only for gable walls) */}
                {isGableWall(wall) && (
                  <Card className="mb-3">
                    <Card.Header>
                      <Form.Check
                        type="checkbox"
                        id={`roof-extension-${wall}`}
                        label="Roof Extension"
                        checked={wallData.roofExtension.enabled}
                        onChange={(e) => updateWallField(wall, 'roofExtension.enabled', e.target.checked)}
                      />
                    </Card.Header>
                    {wallData.roofExtension.enabled && (
                      <Card.Body>
                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Width (ft)</Form.Label>
                              <Form.Control
                                type="number"
                                min={1}
                                max={10}
                                step={0.5}
                                value={wallData.roofExtension.width}
                                size="sm"
                                onChange={(e) => updateWallField(wall, 'roofExtension.width', parseFloat(e.target.value))}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Drop Walls</Form.Label>
                              <Form.Select
                                value={wallData.roofExtension.dropWalls}
                                size="sm"
                                onChange={(e) => updateWallField(wall, 'roofExtension.dropWalls', e.target.value)}
                              >
                                <option value="none">None</option>
                                <option value="sides">Left & Right</option>
                                <option value="all">All</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        {wallData.roofExtension.dropWalls !== 'none' && (
                          <Form.Group>
                            <Form.Label>Wall Height (from eaves, ft)</Form.Label>
                            <Form.Control
                              type="number"
                              min={1}
                              max={buildingHeight}
                              step={0.5}
                              value={wallData.roofExtension.wallHeight}
                              size="sm"
                              onChange={(e) => updateWallField(wall, 'roofExtension.wallHeight', parseFloat(e.target.value))}
                            />
                          </Form.Group>
                        )}
                      </Card.Body>
                    )}
                  </Card>
                )}
              </Tab.Pane>
            ))}
          </Tab.Content>
        </Tab.Container>
      </Card.Body>
    </Card>
  );
};

export default WallOptions;