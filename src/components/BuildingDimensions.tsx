import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';

interface BuildingDimensionsProps {
  data: {
    length: number;
    width: number;
    height: number;
    bays: number;
  };
  updateField: (field: string, value: any) => void;
}

const BuildingDimensions: React.FC<BuildingDimensionsProps> = ({ data, updateField }) => {
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
        <Row>
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
        </Row>
      </Card.Body>
    </Card>
  );
};

export default BuildingDimensions;