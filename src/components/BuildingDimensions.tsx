import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';

interface BuildingDimensionsProps {
  data: {
    length: number;
    width: number;
    height: number;
    pitch: number;
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
          <Col md={4}>
            <Form.Group controlId="length">
              <Form.Label>Length (ft)</Form.Label>
              <Form.Control 
                type="number" 
                min={20} 
                step={1}
                value={data.length}
                onChange={(e) => updateField('length', parseFloat(e.target.value))}
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="width">
              <Form.Label>Width (ft)</Form.Label>
              <Form.Control 
                type="number" 
                min={20} 
                step={1}
                value={data.width}
                onChange={(e) => updateField('width', parseFloat(e.target.value))}
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="height">
              <Form.Label>Eave Height (ft)</Form.Label>
              <Form.Select
                value={data.height}
                onChange={(e) => updateField('height', parseFloat(e.target.value))}
                required
              >
                <option value="10">10</option>
                <option value="12">12</option>
                <option value="14">14</option>
                <option value="16">16</option>
                <option value="18">18</option>
                <option value="20">20</option>
                <option value="22">22</option>
                <option value="24">24</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group controlId="pitch">
              <Form.Label>Roof Pitch (x:12)</Form.Label>
              <Form.Control 
                type="number" 
                min={0.1} 
                max={12} 
                step={0.1}
                value={data.pitch}
                onChange={(e) => updateField('pitch', parseFloat(e.target.value))}
                required 
              />
              <Form.Text className="text-muted">Value between 0.1 and 12</Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="bays">
              <Form.Label>Number of Bays</Form.Label>
              <Form.Control 
                type="number" 
                min={1} 
                step={1}
                value={data.bays}
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