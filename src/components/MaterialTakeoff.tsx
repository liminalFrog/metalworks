import React, { useState, useEffect } from 'react';
import { Card, Table, Tabs, Tab, Badge, Pagination } from 'react-bootstrap';

interface MaterialTakeoffProps {
  takeoff: string;
}

interface TakeoffItem {
  category: string;
  description: string;
  quantity: string;
  size: string;
  notes: string;
}

const MaterialTakeoff: React.FC<MaterialTakeoffProps> = ({ takeoff }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Handle tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);
  
  if (!takeoff) return null;
  
  // Parse the takeoff text into structured data for the table
  const parseToTableData = (text: string): TakeoffItem[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const items: TakeoffItem[] = [];
    
    let currentCategory = 'General';
    
    for (const line of lines) {
      // Skip the material takeoff header
      if (line.startsWith('Material Takeoff for')) {
        continue;
      }
      
      // Handle category headers (lines starting with // followed by category name:)
      if (line.startsWith('// ')) {
        const categoryMatch = line.match(/\/\/\s+([A-Z\s]+):/);
        if (categoryMatch) {
          currentCategory = categoryMatch[1];
        }
        continue;
      }
      
      // Handle notes
      if (line.startsWith('// - Note:')) {
        const noteText = line.substring(10).trim();
        items.push({
          category: 'Notes',
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
            category: currentCategory,
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
              category: currentCategory,
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
                category: currentCategory,
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
                  category: currentCategory,
                  description: complexMatches[1].trim(),
                  quantity: '',
                  size: '',
                  notes: complexMatches[2].trim()
                });
              } else {
                // Fallback for lines that don't match expected patterns
                items.push({
                  category: currentCategory,
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
  
  // Get unique categories for tabs and ensure they're sorted properly
  const allCategories = [...new Set(tableData.map(item => item.category))];
  
  // We want Notes first, then by alphabetical order
  const sortedCategories = ['Notes', ...allCategories.filter(cat => cat !== 'Notes').sort()];
  const categories = ['All', ...sortedCategories];
  
  // Create a count of items per category
  const categoryCounts = tableData.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as {[key: string]: number});
  
  // Filter items based on active tab
  const filteredItems = activeTab === 'all' 
    ? tableData 
    : tableData.filter(item => item.category.toLowerCase() === activeTab);
    
  // Calculate pagination values
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Get current items for the page
  const currentItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Function to get appropriate badge color for categories
  const getCategoryBadgeColor = (category: string): string => {
    const catLower = category.toLowerCase();
    if (catLower === 'structural') return 'primary';
    if (catLower === 'paneling') return 'success';
    if (catLower === 'trim') return 'info';
    if (catLower === 'fasteners') return 'dark';
    if (catLower === 'doors and windows') return 'warning';
    if (catLower === 'accessories') return 'danger';
    if (catLower === 'notes') return 'light';
    return 'secondary';
  };
  
  return (
    <div className="mt-4 mb-5">
      <h3>Material Takeoff</h3>
      <Card>
        <Card.Header>
          <Tabs 
            activeKey={activeTab} 
            onSelect={(k) => setActiveTab(k || 'all')}
            className="mb-0"
            variant="pills"
          >
            <Tab 
              eventKey="all" 
              title={
                <div className="d-flex align-items-center">
                  <span>All</span>
                  <Badge bg="secondary" pill className="ms-2">{tableData.length}</Badge>
                </div>
              }
            />
            {categories.filter(cat => cat !== 'All').map(category => {
              // Skip categories with no items
              if (!categoryCounts[category]) return null;
              
              const badgeColor = getCategoryBadgeColor(category);
              
              return (
                <Tab 
                  key={category} 
                  eventKey={category.toLowerCase()} 
                  title={
                    <div className="d-flex align-items-center">
                      <span>{category}</span>
                      <Badge bg={badgeColor} pill className="ms-2">{categoryCounts[category] || 0}</Badge>
                    </div>
                  }
                />
              );
            })}
          </Tabs>
        </Card.Header>
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
              {currentItems.map((item, index) => {
                // For note items, span across all columns
                if (item.description === 'Note') {
                  return (
                    <tr key={index} className="table-secondary">
                      <td colSpan={4} className="fst-italic text-muted">
                        <small>{item.notes}</small>
                      </td>
                    </tr>
                  );
                }
                
                // Get badge color based on category
                const badgeColor = getCategoryBadgeColor(item.category);
                
                // For regular items
                return (
                  <tr key={index}>
                    <td>
                      {item.description}
                      <Badge 
                        bg={badgeColor} 
                        pill 
                        className="ms-2 takeoff-category-inline"
                      >
                        {item.category}
                      </Badge>
                    </td>
                    <td className="text-center">{item.quantity}</td>
                    <td>{item.size}</td>
                    <td>{item.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted small">
                Showing items {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
              </div>
              <Pagination size="sm">
                <Pagination.First 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1} 
                />
                
                {/* Show up to 5 page numbers centered around current page */}
                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  // Calculate page number to show
                  let pageNum;
                  if (totalPages <= 5) {
                    // If 5 or fewer total pages, just show all
                    pageNum = idx + 1;
                  } else {
                    // Otherwise show a window around current page
                    const leftBound = Math.max(1, currentPage - 2);
                    const rightBound = Math.min(totalPages, currentPage + 2);
                    const windowSize = rightBound - leftBound + 1;
                    
                    if (windowSize < 5) {
                      // Adjust window if we're at the edges
                      if (leftBound === 1) {
                        pageNum = idx + 1;
                      } else {
                        pageNum = totalPages - 4 + idx;
                      }
                    } else {
                      pageNum = leftBound + idx;
                    }
                  }
                  
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  );
                })}
                
                <Pagination.Next 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages} 
                />
                <Pagination.Last 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages} 
                />
              </Pagination>
            </div>
          )}
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