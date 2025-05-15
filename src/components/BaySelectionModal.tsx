import React, { useState, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';

interface BaySelectionModalProps {
  show: boolean;
  onHide: () => void;
  bays: number;
  selectedBay?: string;
  onBaySelected: (bay: string) => void;
  buildingWidth?: number;
  buildingLength?: number;
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
  buildingWidth = 40,
  buildingLength = 80
}) => {
  const [hoveredBay, setHoveredBay] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'East' | 'West' | null>(null);
  
  // Reset selectedSide when the modal opens
  useEffect(() => {
    if (show) {
      setSelectedSide(null);
    }
  }, [show]);

  // Calculate aspect ratio
  const aspectRatio = buildingLength / buildingWidth;
  const bayHeight = `${Math.floor(100 / bays)}%`;
  
  // Render a single table with West and East as columns, and bays as rows
  const renderBayRows = () => {
    const rows = [];
    
    for (let i = 0; i < bays; i++) {
      const bayLabel = getBayLabel(i);
      const isSelectedBay = selectedBay === bayLabel;
      const isEastHovered = hoveredBay === `East-${bayLabel}`;
      const isWestHovered = hoveredBay === `West-${bayLabel}`;
      const isEastSelected = isSelectedBay && (selectedSide === 'East' || selectedSide === null);
      const isWestSelected = isSelectedBay && (selectedSide === 'West' || selectedSide === null);
      
      rows.push(
        <tr 
          key={`bay-row-${bayLabel}`}
          style={{ height: bayHeight }}
        >
          <td 
            style={{
              textAlign: 'center',
              fontWeight: isSelectedBay ? 'bold' : 'normal',
              padding: '10px',
              backgroundColor: isSelectedBay ? '#e6f0ff' : '#f8f9fa',
              border: '1px solid #dee2e6'
            }}
          >
            Bay {bayLabel}
          </td>
          <td 
            className={`bay-cell ${isWestSelected ? 'selected' : ''} ${isWestHovered ? 'hovered' : ''}`}
            onClick={() => {
              onBaySelected(bayLabel);
              setSelectedSide('West');
            }}
            onMouseEnter={() => setHoveredBay(`West-${bayLabel}`)}
            onMouseLeave={() => setHoveredBay(null)}
            style={{
              cursor: 'pointer',
              padding: '20px', 
              textAlign: 'center',
              backgroundColor: isWestSelected ? '#2176FF' : 
                              isSelectedBay ? '#e6f0ff' : 
                              isWestHovered ? '#e6f0ff' : '#ffffff',
              color: isWestSelected ? 'white' : 'black',
              border: '1px solid #dee2e6',
              fontWeight: isWestSelected ? 'bold' : 'normal',
              position: 'relative'
            }}
          >
            <div>West Side</div>
          </td>
          <td 
            className={`bay-cell ${isEastSelected ? 'selected' : ''} ${isEastHovered ? 'hovered' : ''}`}
            onClick={() => {
              onBaySelected(bayLabel);
              setSelectedSide('East');
            }}
            onMouseEnter={() => setHoveredBay(`East-${bayLabel}`)}
            onMouseLeave={() => setHoveredBay(null)}
            style={{
              cursor: 'pointer',
              padding: '20px', 
              textAlign: 'center',
              backgroundColor: isEastSelected ? '#2176FF' : 
                              isSelectedBay ? '#e6f0ff' : 
                              isEastHovered ? '#e6f0ff' : '#ffffff',
              color: isEastSelected ? 'white' : 'black',
              border: '1px solid #dee2e6',
              fontWeight: isEastSelected ? 'bold' : 'normal',
              position: 'relative'
            }}
          >
            <div>East Side</div>
          </td>
        </tr>
      );
    }
    
    return rows;
  };
  // Use aspectRatio to set the table dimensions
  const tableStyle = {
    height: '400px', // Fixed height
    width: `${400 * aspectRatio}px`, // Width based on the aspect ratio
    margin: '0 auto',
    tableLayout: 'fixed' as const
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Select a Bay</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Click on the bay where you want to place this item:</p>
        <div className="bay-selection-container" style={{ overflowX: 'auto' }}>
          <Table bordered style={tableStyle}>
            <thead>
              <tr>
                <th style={{ textAlign: 'center', width: '100px' }}>Bay</th>
                <th style={{ textAlign: 'center' }}>West Wall</th>
                <th style={{ textAlign: 'center' }}>East Wall</th>
              </tr>
            </thead>
            <tbody style={{ height: '100%' }}>
              {renderBayRows()}
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