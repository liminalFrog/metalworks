import React from 'react';
import { Card, Table } from 'react-bootstrap';

interface MaterialTakeoffProps {
  takeoff: string;
}

interface TakeoffItem {
  description: string;
  quantity: string;
  size: string;
  notes: string;
}

const MaterialTakeoff: React.FC<MaterialTakeoffProps> = ({ takeoff }) => {
  if (!takeoff) return null;
  
  // Parse the takeoff text into structured data for the table
  const parseToTableData = (text: string): TakeoffItem[] => {
    // Skip the first few lines (header notes)
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const items: TakeoffItem[] = [];
    
    let currentSection = '';
    
    for (const line of lines) {
      // Handle section headers and notes
      if (line.startsWith('Material Takeoff for')) {
        currentSection = 'header';
        continue;
      }
      
      if (line.startsWith('- Note:')) {
        const noteText = line.substring(8).trim();
        items.push({
          description: 'Note',
          quantity: '',
          size: '',
          notes: noteText
        });
        continue;
      }
      
      // Handle regular material items
      if (line.startsWith('-')) {
        const itemText = line.substring(1).trim();
        
        // Try to parse out quantity and size information
        const matches = itemText.match(/^(.*?):\s+(\d+(?:\.\d+)?)\s+@\s+(.*?)(?:\s+each)?(?:\s+\((.*)\))?$/);
        
        if (matches) {
          // Standard format: "Item: Quantity @ Size each (notes)"
          items.push({
            description: matches[1].trim(),
            quantity: matches[2].trim(),
            size: matches[3].trim(),
            notes: matches[4] ? matches[4].trim() : ''
          });
        } else {
          // Special case for items without size information
          const simpleMatches = itemText.match(/^(.*?):\s+(\d+(?:\.\d+)?)(?:\s+\((.*)\))?$/);
          
          if (simpleMatches) {
            items.push({
              description: simpleMatches[1].trim(),
              quantity: simpleMatches[2].trim(),
              size: '',
              notes: simpleMatches[3] ? simpleMatches[3].trim() : ''
            });
          } else {
            // Handle specific case for square tubing
            const tubingMatches = itemText.match(/^(.*?):\s+(\d+)\s+@\s+(.*?)\s+each\s+\((.*?)\)$/);
            
            if (tubingMatches) {
              items.push({
                description: tubingMatches[1].trim(),
                quantity: tubingMatches[2].trim(),
                size: tubingMatches[3].trim(),
                notes: tubingMatches[4].trim()
              });
            } else {
              // Handle complex formats like the wall panels with height arrays
              const complexMatches = itemText.match(/^(.*?):\s+(.*?)$/);
              
              if (complexMatches) {
                items.push({
                  description: complexMatches[1].trim(),
                  quantity: '',
                  size: '',
                  notes: complexMatches[2].trim()
                });
              } else {
                // Fallback for lines that don't match expected patterns
                items.push({
                  description: itemText,
                  quantity: '',
                  size: '',
                  notes: ''
                });
              }
            }
          }
        }
      }
    }
    
    return items;
  };
  
  const tableData = parseToTableData(takeoff);
  
  return (
    <div className="mt-4 mb-5">
      <h3>Material Takeoff</h3>
      <Card>
        <Card.Body>
          <Table striped bordered hover responsive className="material-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Quantity</th>
                <th>Size</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, index) => (
                <tr key={index} className={item.description === 'Note' ? 'table-secondary' : ''}>
                  <td>{item.description}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td>{item.size}</td>
                  <td>{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Keep the original pre-formatted text but hide it with a toggle option */}
      <details className="mt-3">
        <summary>Show raw output</summary>
        <pre className="takeoff-results mt-2">{takeoff}</pre>
      </details>
    </div>
  );
};

export default MaterialTakeoff;