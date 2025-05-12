import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Row, Col, Accordion, Button } from 'react-bootstrap';

interface StructuralFrameConfig {
  columnType: string;
  columnSize: string;
  beamType: string;
  beamSize: string;
}

interface BuildingDimensionsProps {
  data: {
    length: number;
    width: number;
    height: number;
    bays: number;
    structuralFrames?: StructuralFrameConfig[];
  };
  updateField: (field: string, value: any) => void;
}

const BuildingDimensions: React.FC<BuildingDimensionsProps> = ({ data, updateField }) => {
  const [structuralExpanded, setStructuralExpanded] = useState(false);
  const initialSetupDone = useRef(false);
  
  // Column type options
  const columnTypes = ['W', 'HSS Rect.', 'HSS Round', 'Pipe', 'C', 'S'];
  
  // Column size options based on type
  const columnSizeOptions = {
    'W': ['8x10', '8x13', '8x15', '10x12', '10x15', '10x22', '12x14', '12x22', '12x26'],
    'HSS Rect.': ['4x4x1/4', '6x4x1/4', '6x6x1/4', '6x6x3/8', '8x6x1/4', '8x8x1/4', '8x8x3/8'],
    'HSS Round': ['4x1/4', '5x1/4', '5x3/8', '6x1/4', '6x3/8', '8x1/4', '8x3/8'],
    'Pipe': ['4 STD', '5 STD', '6 STD', '8 STD', '4 XS', '5 XS', '6 XS'],
    'C': ['8x11.5', '10x15.3', '12x20.7', '15x33.9'],
    'S': ['8x18.4', '10x25.4', '12x31.8', '15x42.9']
  };
  
  // Beam type options
  const beamTypes = ['W', 'HSS Rect.', 'C', 'S'];
  
  // Beam size options based on type
  const beamSizeOptions = {
    'W': ['8x10', '8x13', '10x12', '10x15', '10x22', '12x14', '12x19', '12x22', '12x26', '14x22', '14x26', '16x26', '16x31', '18x35'],
    'HSS Rect.': ['6x4x1/4', '6x6x1/4', '8x4x1/4', '8x6x1/4', '10x6x1/4', '12x6x1/4'],
    'C': ['8x11.5', '10x15.3', '12x20.7', '15x33.9'],
    'S': ['8x18.4', '10x25.4', '12x31.8', '15x42.9']
  };  // Function to create default structural frames is now moved directly into the useEffect
  // Function to update structural frame data
  const updateStructuralFrame = (index: number, field: string, value: string) => {
    if (!data.structuralFrames) return;
    
    const updatedFrames = [...data.structuralFrames];
    updatedFrames[index] = { 
      ...updatedFrames[index],
      [field]: value
    };
    
    updateField('structuralFrames', updatedFrames);
  };
  // Get the appropriate size options based on the type selection
  const getSizeOptions = (type: string, isColumn: boolean): string[] => {
    if (isColumn) {
      return columnSizeOptions[type as keyof typeof columnSizeOptions] || [];
    } else {
      return beamSizeOptions[type as keyof typeof beamSizeOptions] || [];
    }
  };
  // Get the frame label based on index
  const getFrameLabel = (index: number) => {
    if (index === 0) {
      return "North Eave Wall";
    } else if (index === data.bays) {
      return "South Eave Wall";
    } else {
      return `Bay ${index}`;
    }
  };  // Use useEffect to ensure we have the correct structure when the component mounts or when bays change
  // This will only run when data.bays changes or on component mount, not on every re-render
  useEffect(() => {
    const currentFramesLength = data.structuralFrames?.length || 0;
    const expectedFramesLength = data.bays + 1;
    
    // Only update if there's a mismatch in the number of frames needed 
    if (currentFramesLength !== expectedFramesLength) {
      // Skip if we've already set up the frames once and aren't changing bays
      if (initialSetupDone.current && !data.structuralFrames) {
        return;
      }
      
      const defaultFrame = {
        columnType: 'W',
        columnSize: '8x10',
        beamType: 'W',
        beamSize: '8x10'
      };
      
      const middleFrame = {
        columnType: 'W',
        columnSize: '10x22',
        beamType: 'W',
        beamSize: '10x22'
      };
      
      // Create a new array with the correct number of frames
      const frames: StructuralFrameConfig[] = [];
      
      // First frame (north eave wall)
      frames.push({...defaultFrame});
      
      // Middle frames (rigid frames)
      for (let i = 1; i < data.bays; i++) {
        frames.push({...middleFrame});
      }
      
      // Last frame (south eave wall)
      frames.push({...defaultFrame});
      
      // Mark that we've completed the initial setup
      initialSetupDone.current = true;
      
      updateField('structuralFrames', frames);
    }
  }, [data.bays, data.structuralFrames, updateField]);
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <h4>Building Dimensions</h4>
      </Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="width">
              <Form.Label>Width (ft)</Form.Label>
              <Form.Control 
                type="number" 
                min={10} 
                max={100}
                step={1}
                value={data.width}
                size="sm"
                onChange={(e) => updateField('width', parseFloat(e.target.value))}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="length">
              <Form.Label>Length (ft)</Form.Label>
              <Form.Control 
                type="number" 
                min={10} 
                max={200} 
                step={1}
                value={data.length}
                size="sm"
                onChange={(e) => updateField('length', parseFloat(e.target.value))}
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="height">
              <Form.Label>Eave Height (ft)</Form.Label>
              <Form.Control
                type="number"
                min={8}
                max={30}
                step={0.5}
                value={data.height}
                size="sm"
                onChange={(e) => updateField('height', parseFloat(e.target.value))}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="bays">
              <Form.Label>Number of Bays</Form.Label>
              <Form.Control 
                type="number" 
                min={1} 
                max={10}
                step={1}
                value={data.bays}
                size="sm"
                onChange={(e) => updateField('bays', parseInt(e.target.value))}
                required 
              />
            </Form.Group>
          </Col>
        </Row>        {/* Structural Section */}
        <Accordion className="mb-3">
          <Accordion.Item eventKey="0">
            <Accordion.Header>Structural</Accordion.Header>
            <Accordion.Body>
              <Card className="mb-3">
                <Card.Body>
                  <p className="text-muted mb-4">
                    Configure the structural elements for each bay section of the building.
                  </p>
                  
                  {data.structuralFrames && data.structuralFrames.map((frame, index) => (
                    <Card className="mb-3" key={index}>
                      <Card.Header>
                        <strong>{getFrameLabel(index)}</strong>
                      </Card.Header>
                      <Card.Body>
                        <Row className="mb-3">
                          <Col>
                            <strong>Columns</strong>
                          </Col>
                        </Row>
                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Column Type</Form.Label>
                              <Form.Select 
                                size="sm"
                                value={frame.columnType}
                                onChange={(e) => updateStructuralFrame(index, 'columnType', e.target.value)}
                              >
                                {columnTypes.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Column Size</Form.Label>
                              <Form.Select 
                                size="sm"
                                value={frame.columnSize}
                                onChange={(e) => updateStructuralFrame(index, 'columnSize', e.target.value)}
                              >
                                {getSizeOptions(frame.columnType, true).map(size => (
                                  <option key={size} value={size}>{size}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row className="mb-3">
                          <Col>
                            <strong>Beams</strong>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Beam Type</Form.Label>
                              <Form.Select 
                                size="sm"
                                value={frame.beamType}
                                onChange={(e) => updateStructuralFrame(index, 'beamType', e.target.value)}
                              >
                                {beamTypes.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Beam Size</Form.Label>
                              <Form.Select 
                                size="sm"
                                value={frame.beamSize}
                                onChange={(e) => updateStructuralFrame(index, 'beamSize', e.target.value)}
                              >
                                {getSizeOptions(frame.beamType, false).map(size => (
                                  <option key={size} value={size}>{size}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </Card.Body>
              </Card>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Body>
    </Card>
  );
};

export default BuildingDimensions;