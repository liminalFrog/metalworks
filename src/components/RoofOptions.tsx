import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';

interface RoofOptionsProps {
  data: {
    type: string;
    pitch: number;
    purlins: {
      size: string;
      spacing: number;
      maxGap: number;
    };
  };
  updateField: (field: string, value: any) => void;
  buildingWidth?: number;  // Optional, to calculate purlin positions
}

const RoofOptions: React.FC<RoofOptionsProps> = ({ data, updateField, buildingWidth = 40 }) => {
  const pitchOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];
  
  // Calculate the roof span based on width and roof type
  const calculateRoofSpan = (): number => {
    // For a gable roof, the span is half the width
    // For a single slope, the span is the full width
    return data.type === 'gable' ? buildingWidth / 2 : buildingWidth;
  };
  
  // Calculate purlin positions based on spacing and max gap
  const calculatePurlinPositions = () => {
    const roofSpan = calculateRoofSpan();
    const positions: number[] = [];
    
    let currentPos = data.purlins.spacing;
    while (currentPos < roofSpan) {
      positions.push(currentPos);
      currentPos += data.purlins.spacing;
    }
    
    // If the gap between last purlin and peak/edge is greater than maxGap, add one more purlin
    const lastPurlinPos = positions.length > 0 ? positions[positions.length - 1] : 0;
    const gapToEnd = roofSpan - lastPurlinPos;
    
    if (gapToEnd > data.purlins.maxGap && gapToEnd < data.purlins.spacing) {
      // Add one more purlin, positioned to maintain reasonable spacing
      positions.push(roofSpan - data.purlins.maxGap/2);
    }
    
    return positions;
  };
  
  // Update nested purlin fields
  const updatePurlinField = (field: string, value: any) => {
    updateField('purlins', {
      ...data.purlins,
      [field]: value
    });
  };
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <h4>Roof Options</h4>
      </Card.Header>
      <Card.Body>
        {/* Roof Type and Pitch Section */}
        <h5 className="mb-3">Roof Type</h5>
        <Row className="mb-4">
          <Col md={6}>
            <Form.Group controlId="roofType">
              <Form.Label>Roof Type</Form.Label>
              <Form.Select
                value={data.type}
                size="sm"
                onChange={(e) => updateField('roofType', e.target.value)}
                required
              >
                <option value="gable">Gable</option>
                <option value="single">Single Slope</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="roofPitch">
              <Form.Label>Roof Pitch (x:12)</Form.Label>
              <Form.Select
                value={data.pitch}
                size="sm"
                onChange={(e) => updateField('roofPitch', parseFloat(e.target.value))}
                required
              >
                {pitchOptions.map(pitch => (
                  <option key={pitch} value={pitch}>{pitch}:12</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        
        {/* Divider between sections */}
        <hr className="my-4" />
        
        {/* Purlins Section */}
        <h5 className="mb-3">Purlins</h5>
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Size</Form.Label>
              <Form.Select
                value={data.purlins.size}
                size="sm"
                onChange={(e) => updatePurlinField('size', e.target.value)}
              >
                <option value="2x6">2x6</option>
                <option value="2x8">2x8</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Spacing (ft)</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={10}
                step={0.5}
                value={data.purlins.spacing}
                size="sm"
                onChange={(e) => updatePurlinField('spacing', parseFloat(e.target.value))}
              />
              <Form.Text className="text-muted">
                Distance between each purlin
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Max Gap (ft)</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={10}
                step={0.5}
                value={data.purlins.maxGap}
                size="sm"
                onChange={(e) => updatePurlinField('maxGap', parseFloat(e.target.value))}
              />
              <Form.Text className="text-muted">
                Maximum acceptable gap between purlins
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
        
        {/* Purlin Position Preview */}
        <Row>
          <Col>
            <div className="purlin-preview p-2 border rounded bg-light">
              <strong>Purlin Positions: </strong>
              {calculatePurlinPositions()
                .map(pos => pos.toFixed(1))
                .join(', ')} ft
              {data.type === 'gable' && (
                <div className="text-muted small mt-1">
                  (Distances from eave, per roof plane)
                </div>
              )}
              {data.type === 'single' && (
                <div className="text-muted small mt-1">
                  (Distances from low side)
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default RoofOptions;