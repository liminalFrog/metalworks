// New file: src/components/PanelingOptions.tsx
import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';

interface PanelingOptionsProps {
  data: {
    panelType: string;
    wallColor: string;
    trimColor: string;
    roofColor: string;
  };
  updateField: (field: string, value: any) => void;
}

const PanelingOptions: React.FC<PanelingOptionsProps> = ({ data, updateField }) => {
  const panelTypes = [
    { value: 'r-panel', label: 'R Panel' },
    { value: 'pbr', label: 'PBR Panel' },
    { value: 'u-panel', label: 'U Panel' },
    { value: 'standing-seam', label: 'Standing Seam' },
    { value: 'corrugated', label: 'Corrugated' },
  ];

  const colorOptions = [
    { value: 'white', label: 'Bright White' },
    { value: 'lightGray', label: 'Light Gray' },
    { value: 'darkGray', label: 'Dark Gray' },
    { value: 'tan', label: 'Desert Tan' },
    { value: 'brown', label: 'Brown' },
    { value: 'green', label: 'Forest Green' },
    { value: 'burgundy', label: 'Burgundy' },
    { value: 'rusticRed', label: 'Rustic Red' },
    { value: 'galvalume', label: 'Galvalume' },
  ];

  return (
    <Card className="mb-4">
      <Card.Header>
        <h4>Paneling Options</h4>
      </Card.Header>
      <Card.Body>
        {/* Panel Type Selection */}
        <Row className="mb-4">
          <Col>
            <Form.Group controlId="panelType">
              <Form.Label>Panel Type</Form.Label>
              <Form.Select
                value={data.panelType}
                size="sm"
                onChange={(e) => updateField('panelType', e.target.value)}
              >
                {panelTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Select the type of metal paneling for your building
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <hr className="my-3" />

        {/* Color Selection (previous ColorOptions content) */}
        <h5 className="mb-3">Color Selection</h5>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Wall Color</Form.Label>
              <Form.Select
                value={data.wallColor}
                size="sm"
                onChange={(e) => updateField('wallColor', e.target.value)}
              >
                {colorOptions.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </Form.Select>
              <div 
                className="color-preview mt-1" 
                style={{ backgroundColor: getColorCode(data.wallColor) }}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Trim Color</Form.Label>
              <Form.Select
                value={data.trimColor}
                size="sm"
                onChange={(e) => updateField('trimColor', e.target.value)}
              >
                {colorOptions.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </Form.Select>
              <div 
                className="color-preview mt-1" 
                style={{ backgroundColor: getColorCode(data.trimColor) }}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Roof Color</Form.Label>
              <Form.Select
                value={data.roofColor}
                size="sm"
                onChange={(e) => updateField('roofColor', e.target.value)}
              >
                {colorOptions.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </Form.Select>
              <div 
                className="color-preview mt-1" 
                style={{ backgroundColor: getColorCode(data.roofColor) }}
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

// Helper function to get actual color codes
function getColorCode(colorName: string): string {
  const colorMap: {[key: string]: string} = {
    white: '#F8F8F8',
    lightGray: '#D3D3D3',
    darkGray: '#A9A9A9',
    tan: '#D2B48C',
    brown: '#8B4513',
    green: '#228B22',
    burgundy: '#800020',
    rusticRed: '#A52A2A',
    galvalume: '#E8E8E8',
  };
  
  return colorMap[colorName] || '#CCCCCC';
}

export default PanelingOptions;