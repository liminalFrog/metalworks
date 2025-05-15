import React, { useState } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';

interface BaySelectionModalProps {
  show: boolean;
  onHide: () => void;
  bays: number;
  selectedBay?: string;
  onBaySelected: (bay: string) => void;
}

// Utility function to convert number to bay letter (0 -> A, 1 -> B, etc.)
const getBayLabel = (index: number): string => {
  return String.fromCharCode(65 + index);
};

const BaySelectionModal: React.FC<BaySelectionModalProps> = ({
  show,
  onHide,
  bays,
  selectedBay = 'A',
  onBaySelected,
}) => {
  const [hoveredBay, setHoveredBay] = useState<string | null>(null);
  
  // Generate bay elements for a wall (east or west)
  const renderBays = (wall: 'East' | 'West') => {
    const bayElements = [];
    
    for (let i = 0; i < bays; i++) {
      const bayLabel = getBayLabel(i);
      const isSelected = selectedBay === bayLabel;
      const isHovered = hoveredBay === `${wall}-${bayLabel}`;
      
      bayElements.push(
        <td 
          key={`${wall}-${bayLabel}`}
          className={`bay-cell ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
          onClick={() => onBaySelected(bayLabel)}
          onMouseEnter={() => setHoveredBay(`${wall}-${bayLabel}`)}
          onMouseLeave={() => setHoveredBay(null)}
          style={{
            cursor: 'pointer',
            padding: '20px', 
            textAlign: 'center',
            backgroundColor: isSelected ? '#2176FF' : isHovered ? '#e6f0ff' : '#ffffff',
            color: isSelected ? 'white' : 'black',
            border: '1px solid #dee2e6',
            fontWeight: isSelected ? 'bold' : 'normal',
            position: 'relative'
          }}
        >
          <div>Bay {bayLabel}</div>
          <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>
            {wall} Wall
          </div>
        </td>
      );
    }
    
    return bayElements;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Select a Bay</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Click on the bay where you want to place this item:</p>
        <div className="bay-selection-container" style={{ overflowX: 'auto' }}>
          <Table bordered>
            <thead>
              <tr>
                <th colSpan={bays} style={{ textAlign: 'center' }}>East Wall</th>
              </tr>
            </thead>
            <tbody>
              <tr>{renderBays('East')}</tr>
            </tbody>
          </Table>
          
          <Table bordered className="mt-4">
            <thead>
              <tr>
                <th colSpan={bays} style={{ textAlign: 'center' }}>West Wall</th>
              </tr>
            </thead>
            <tbody>
              <tr>{renderBays('West')}</tr>
            </tbody>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BaySelectionModal;