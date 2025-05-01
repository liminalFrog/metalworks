import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';

interface RoofOptionsProps {
  data: {
    type: string;
    pitch: number;
  };
  updateField: (field: string, value: any) => void;
}

const RoofOptions: React.FC<RoofOptionsProps> = ({ data, updateField }) => {
  const pitchOptions = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <h4>Roof Options</h4>
      </Card.Header>
      <Card.Body>
        <Row>
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
      </Card.Body>
    </Card>
  );
};

export default RoofOptions;