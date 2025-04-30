import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';

interface GuttersProps {
  data: string;
  updateField: (value: string) => void;
}

const Gutters: React.FC<GuttersProps> = ({ data, updateField }) => {
  return (
    <Card className="mb-4">
      <Card.Header>
        <h4>Gutters</h4>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col>
            <Form.Group controlId="gutters">
              <Form.Label>Include Gutters?</Form.Label>
              <Form.Select
                value={data}
                onChange={(e) => updateField(e.target.value)}
                required
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default Gutters;