import React from 'react';
import { Card, Form, Row, Col, Button } from 'react-bootstrap';

interface DynamicFieldsProps {
  title: string;
  items: { width: number; height: number }[];
  updateItems: (items: { width: number; height: number }[]) => void;
  addItem: () => { width: number; height: number };
}

const DynamicFields: React.FC<DynamicFieldsProps> = ({ title, items, updateItems, addItem }) => {
  
  const handleAdd = () => {
    updateItems([...items, addItem()]);
  };
  
  const handleRemove = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    updateItems(newItems);
  };
  
  const updateItemField = (index: number, field: 'width' | 'height', value: number) => {
    const newItems = [...items];
    newItems[index][field] = value;
    updateItems(newItems);
  };
  
  return (
    <Card className="mb-4">
      <Card.Header>
        <h4>{title}</h4>
      </Card.Header>
      <Card.Body>
        {items.map((item, index) => (
          <Row className="mb-3" key={index}>
            <Col md={5}>
              <Form.Label>Width (ft)</Form.Label>
              <Form.Control
                type="number"
                size="sm"
                min={1}
                step={0.1}
                value={item.width}
                onChange={(e) => updateItemField(index, 'width', parseFloat(e.target.value))}
                placeholder="Width (ft)"
              />
            </Col>
            <Col md={5}>
              <Form.Label>Height (ft)</Form.Label>
              <Form.Control
                type="number"
                size="sm"
                min={1}
                step={0.1}
                value={item.height}
                onChange={(e) => updateItemField(index, 'height', parseFloat(e.target.value))}
                placeholder="Height (ft)"
              />
            </Col>
            <Col md={2}>
              <Button variant="danger" size="sm" onClick={() => handleRemove(index)}>
                Remove
              </Button>
            </Col>
          </Row>
        ))}
        <Button variant="primary" size="sm" onClick={handleAdd}>
          Add {title.slice(0, -1)}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default DynamicFields;