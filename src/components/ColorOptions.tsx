import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';

interface ColorOptionsProps {
  data: {
    wallColor: string;
    trimColor: string;
    roofColor: string;
  };
  updateField: (field: string, value: any) => void;
}

const ColorOptions: React.FC<ColorOptionsProps> = ({ data, updateField }) => {
  const colorOptions = [
    { value: 'white', label: 'White' },
    { value: 'tan', label: 'Tan' },
    { value: 'brown', label: 'Brown' },
    { value: 'lightGray', label: 'Light Gray' },
    { value: 'charcoalGray', label: 'Charcoal Gray' },
    { value: 'green', label: 'Green' },
    { value: 'burgundy', label: 'Burgundy' },
    { value: 'galvalume', label: 'Galvalume' },
  ];
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <h4>Color Options</h4>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={4}>
            <Form.Group controlId="wallColor">
              <Form.Label>Wall Color</Form.Label>
              <Form.Select
                value={data.wallColor}
                size="sm"
                onChange={(e) => updateField('wallColor', e.target.value)}
                required
              >
                {colorOptions.map(color => (
                  <option key={color.value} value={color.value}>{color.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="trimColor">
              <Form.Label>Trim Color</Form.Label>
              <Form.Select
                value={data.trimColor}
                size="sm"
                onChange={(e) => updateField('trimColor', e.target.value)}
                required
              >
                {colorOptions.map(color => (
                  <option key={color.value} value={color.value}>{color.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="roofColor">
              <Form.Label>Roof Color</Form.Label>
              <Form.Select
                value={data.roofColor}
                size="sm"
                onChange={(e) => updateField('roofColor', e.target.value)}
                required
              >
                {colorOptions.map(color => (
                  <option key={color.value} value={color.value}>{color.label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default ColorOptions;