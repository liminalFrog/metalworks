import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';
import ValidatedInput from './ValidatedInput';

interface RoofOptionsProps {
  data: {
    type: string;
    pitch: number;
    purlins: {
      size: string;
      spacing: number;
      maxGap: number;
    };
    panelType?: string;
    roofOverhang?: number; // Amount to add to roof panel length (in inches)
    roofPeakGap?: number;  // Gap to leave at peak (in inches)
  };
  updateField: (field: string, value: any) => void;
  buildingWidth?: number;  // Optional, to calculate purlin positions
}

const RoofOptions: React.FC<RoofOptionsProps> = ({ data, updateField, buildingWidth = 40 }) => {
  const pitchOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];
  
  // Panel type options
  const panelTypes = [
    { value: 'r-panel', label: 'R Panel' },
    { value: 'pbr', label: 'PBR Panel' },
    { value: 'u-panel', label: 'U Panel' },
    { value: 'standing-seam', label: 'Standing Seam' },
    { value: 'corrugated', label: 'Corrugated' },
  ];
  
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
        
        {/* Roof Panel Options */}
        <h5 className="mb-3">Roof Panel Options</h5>
        <Row className="mb-4">
          <Col md={4}>
            <Form.Group controlId="panelType">
              <Form.Label>Panel Type</Form.Label>
              <Form.Select
                value={data.panelType || 'r-panel'}
                size="sm"
                onChange={(e) => updateField('panelType', e.target.value)}
                required
              >
                {panelTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>            <ValidatedInput
              type="number"
              id="roofOverhang"
              label="Overhang (inches)"
              min={0}
              max={12}
              step={0.5}
              value={data.roofOverhang !== undefined ? data.roofOverhang : 2}
              size="sm"
              onChange={(value) => updateField('roofOverhang', value)}
              helpText="Added to total panel length"
              defaultValue={2}
            />
          </Col>
          <Col md={4}>            <ValidatedInput
              type="number"
              id="roofPeakGap"
              label="Peak Gap (inches)"
              min={0}
              max={12}
              step={0.5}
              value={data.roofPeakGap !== undefined ? data.roofPeakGap : 1}
              size="sm"
              onChange={(value) => updateField('roofPeakGap', value)}
              helpText="Gap to leave at ridge"
              defaultValue={1}
            />
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
            <Form.Group>              <ValidatedInput
                type="number"
                id="purlinSpacing"
                label="Spacing (ft)"
                min={1}
                max={10}
                step={0.5}
                value={data.purlins.spacing}
                size="sm"
                onChange={(value) => updatePurlinField('spacing', value)}
                helpText="Distance between each purlin"
                defaultValue={5}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>              <ValidatedInput
                type="number"
                id="purlinMaxGap"
                label="Max Gap (ft)"
                min={1}
                max={10}
                step={0.5}
                value={data.purlins.maxGap}
                size="sm"
                onChange={(value) => updatePurlinField('maxGap', value)}
                helpText="Maximum acceptable gap between purlins"
                defaultValue={6}
              />
            </Form.Group>
          </Col>
        </Row>
        
        {/* Purlin Position Preview */}
        <Row className="mb-4">
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

        {/* Divider between sections */}
        <hr className="my-4" />

        {/* Roof Panel Options */}
        <h5 className="mb-3">Roof Panels</h5>
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Panel Type</Form.Label>
              <Form.Select
                value={data.panelType}
                size="sm"
                onChange={(e) => updateField('panelType', e.target.value)}
              >
                {panelTypes.map(panel => (
                  <option key={panel.value} value={panel.value}>{panel.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>              <ValidatedInput
                type="number"
                id="roofOverhang2"
                label="Overhang (inches)"
                min={0}
                max={24}
                step={1}
                value={data.roofOverhang || 0}
                size="sm"
                onChange={(value) => updateField('roofOverhang', value)}
                helpText="Additional length to add to roof panels"
                defaultValue={2}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>              <ValidatedInput
                type="number"
                id="roofPeakGap2"
                label="Peak Gap (inches)"
                min={0}
                max={12}
                step={0.5}
                value={data.roofPeakGap || 0}
                size="sm"
                onChange={(value) => updateField('roofPeakGap', value)}
                helpText="Gap to leave at the roof peak"
                defaultValue={1}
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default RoofOptions;