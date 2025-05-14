import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Form, Button, Spinner, ButtonGroup } from 'react-bootstrap';
import { ipcRenderer } from 'electron';
import { FaArrowAltCircleRight, FaPrint, FaCopy, FaSync } from 'react-icons/fa';
import BuildingDimensions from './components/BuildingDimensions';
import RoofOptions from './components/RoofOptions';
import InsulationOptions from './components/InsulationOptions';
import PanelingOptions from './components/PanelingOptions';
import WallOptions from './components/WallOptions';
import MaterialTakeoff from './components/MaterialTakeoff';
import MenuBar from './components/MenuBar';
import { generateMaterialTakeoff } from './calculations';
import './styles/App.scss';

function App() {
  // Create a function to generate a fresh wall config to avoid reference issues
  const createWallConfig = () => ({
    girts: {
      size: 'C2x6',
      sizeLocked: false,
      spacing: 5,
      spacingLocked: false,
      maxGap: 6,
      maxGapLocked: false
    },
    doors: [], // Will add subtractInsulation property when doors are added
    windows: [], // Will add subtractInsulation property when windows are added
    bayDoors: [], // Will add subtractInsulation: true when bay doors are added
    openings: [], // Will add subtractInsulation: true when openings are added
    awning: {
      enabled: false,
      height: 8,
      width: 10,
      spanWall: false,
      length: 6,
      position: {
        centered: true,
        centerIn: 'building',
        bay: 'A',
        distance: 5,
        from: 'left',
        edgeOf: 'building'
      },
      wraparound: 'none',
      pitch: 1,
      postType: '4x4x14ga'
    },
    roofExtension: {
      enabled: false,
      width: 4,
      dropWalls: 'none',
      wallHeight: 4
    }
  });

  // Default state for a new document
  const defaultBuildingData = {
    length: 40,
    width: 40,
    height: 12,
    bays: 2,
    roofType: 'gable',
    roofPitch: 3,
    purlins: {
      size: '2x6',
      spacing: 5,
      maxGap: 6
    },
    insulation: {
      enabled: false,
      type: 'batt'
    },
    panelType: 'r-panel',
    roofOverhang: 2,  // 2" overhang by default
    roofPeakGap: 1,   // 1" peak gap by default
    wallColor: 'white',
    trimColor: 'lightGray',
    roofColor: 'galvalume',
    walls: {
      north: createWallConfig(),
      east: createWallConfig(),
      south: createWallConfig(),
      west: createWallConfig()
    },
    structuralFrames: [
      // North eave wall (first frame)
      {
        columnType: 'W',
        columnSize: '8x10',
        beamType: 'W',
        beamSize: '8x10'
      },
      // Middle frame (Bay 1)
      {
        columnType: 'W',
        columnSize: '10x22',
        beamType: 'W',
        beamSize: '10x22'
      },
      // South eave wall (last frame)
      {
        columnType: 'W',
        columnSize: '8x10',
        beamType: 'W',
        beamSize: '8x10'
      }
    ],
    gutters: 'yes',
    manDoors: [{ width: 3, height: 7 }],
    rollUpDoors: [
      { width: 16, height: 10 },
      { width: 10, height: 10 },
      { width: 10, height: 10 }
    ],
    windows: [],
    awnings: []
  };

  const [buildingData, setBuildingData] = useState(defaultBuildingData);
  const [materialTakeoff, setMaterialTakeoff] = useState('');
  const [appLoading, setAppLoading] = useState(true);

  // File management state
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isDocumentModified, setIsDocumentModified] = useState(false);
  const [originalBuildingData, setOriginalBuildingData] = useState(defaultBuildingData);

  // Update this function to properly handle nested updates and track modifications
  const updateField = (field: string, value: any) => {
    setBuildingData(prev => {
      // Make a deep copy for the walls to ensure each wall's settings remain independent
      if (field === 'walls') {
        const newData = {
          ...prev,
          walls: value // This is already a new object from WallOptions
        };
        setIsDocumentModified(true);
        return newData;
      }

      // For other fields
      const newData = {
        ...prev,
        [field]: value
      };
      setIsDocumentModified(true);
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e?.preventDefault();
    const takeoff = generateMaterialTakeoff(buildingData);
    setMaterialTakeoff(takeoff);
  };

  const handleCopyList = () => {
    if (materialTakeoff) {
      navigator.clipboard.writeText(materialTakeoff)
        .then(() => {
          console.log('Material takeoff copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    }
  };
  const handleExport = () => {
    if (materialTakeoff) {
      const blob = new Blob([materialTakeoff], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `metalworks_takeoff_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
    const handlePrint = () => {
    if (materialTakeoff) {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups for this website');
        return;
      }
      
      // Parse the material takeoff data to create a table structure
      const parseToTableData = (text: string) => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const items = [];
        
        let currentCategory = 'General';
        
        for (const line of lines) {
          // Skip the material takeoff header
          if (line.startsWith('Material Takeoff for') || line.startsWith('MATERIAL TAKEOFF')) {
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
            const noteContent = line.substring('// - Note:'.length).trim();
            items.push({
              category: 'Notes',
              description: 'Note',
              quantity: '',
              size: '',
              notes: noteContent
            });
            continue;
          }
          
          // Handle regular items (starting with a dash)
          if (line.startsWith('-')) {
            let itemText = line.substring(1).trim();
            
            // Handle case with direct quantity/size information (like '- Man Door Header Purlins: 1 @ 20' each')
            const qtyMatch = itemText.match(/^(.*?):\s+(\d+)\s+@\s+([\d']+"?)(?:\s+each)?(?:\s+\((.*)\))?$/);
            if (qtyMatch) {
              items.push({
                category: currentCategory,
                description: qtyMatch[1].trim(),
                quantity: qtyMatch[2].trim(),
                size: qtyMatch[3].trim(),
                notes: qtyMatch[4] ? qtyMatch[4].trim() : ''
              });
              continue;
            }
            
            // Handle items with quantity but no size (like '- Peak Boxes: 2')
            const simpleQtyMatch = itemText.match(/^(.*?):\s+(\d+)(?:\s+\((.*)\))?$/);
            if (simpleQtyMatch) {
              items.push({
                category: currentCategory,
                description: simpleQtyMatch[1].trim(),
                quantity: simpleQtyMatch[2].trim(),
                size: '',
                notes: simpleQtyMatch[3] ? simpleQtyMatch[3].trim() : ''
              });
              continue;
            }
            
            // Handle square tubing format ('- 4"x4"x14 Gauge Square Tubing: 2 @ 12' each (for roll-up door jambs)')
            const tubingMatches = itemText.match(/^(.*?):\s+(\d+)\s+@\s+([\d']+"?)(?:\s+each)?(?:\s+\((.*)\))?$/);
            if (tubingMatches) {
              items.push({
                category: currentCategory,
                description: tubingMatches[1].trim(),
                quantity: tubingMatches[2].trim(),
                size: tubingMatches[3].trim(),
                notes: tubingMatches[4] ? tubingMatches[4].trim() : ''
              });
              continue;
            }
            
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
        
        return items;
      };
      
      // Parse the material takeoff data
      const tableData = parseToTableData(materialTakeoff);
      
      // Get unique categories
      const allCategories = [...new Set(tableData.map(item => item.category))];
      
      // Sort categories
      const sortedCategories = ['Notes', ...allCategories.filter(cat => cat !== 'Notes').sort()];
      
      // Function to get category badge color
      const getCategoryBadgeColor = (category) => {
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
      
      // Generate table rows for each category
      let tableContent = '';
      
      sortedCategories.forEach(category => {
        const categoryItems = tableData.filter(item => item.category === category);
        if (categoryItems.length > 0) {
          // Add category header
          const badgeColor = getCategoryBadgeColor(category);
          tableContent += `
            <tr>
              <td colspan="4" class="category-header bg-light">
                <span class="badge bg-${badgeColor} rounded-pill">${category} (${categoryItems.length})</span>
              </td>
            </tr>
          `;
          
          // Add items for this category
          categoryItems.forEach(item => {
            if (item.description === 'Note') {
              tableContent += `
                <tr class="table-secondary">
                  <td colspan="4" class="fst-italic text-muted">
                    <small>${item.notes}</small>
                  </td>
                </tr>
              `;
            } else {
              tableContent += `                <tr>
                  <td>
                    ${item.description}
                    <span class="badge bg-${getCategoryBadgeColor(category)} ms-2 takeoff-category-inline">
                      ${item.category}
                    </span>
                  </td>
                  <td class="text-center">${item.quantity}</td>
                  <td>${item.size}</td>
                  <td>${item.notes}</td>
                </tr>
              `;
            }
          });
        }
      });
        // Include both the Bootstrap styles and the app's styles
      
      // Get the app's styles from the current document
      const appStyles = Array.from(document.styleSheets)
        .filter(sheet => {
          try {
            // Filter out external stylesheets we can't access due to CORS
            return sheet.cssRules && sheet.cssRules.length > 0;
          } catch (e) {
            return false;
          }
        })
        .map(sheet => {
          // Extract CSS rules from each stylesheet
          try {
            return Array.from(sheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n');
          } catch (e) {
            return '';
          }
        })
        .join('\n');
      
      // Add Bootstrap styles and create the print window HTML
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Material Takeoff</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
              ${appStyles}
              
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                padding: 20px;
              }
              .table {
                width: 100%;
                margin-bottom: 1rem;
                color: #212529;
                border-collapse: collapse;
              }
              .table th, .table td {
                padding: 0.75rem;
                border: 1px solid #dee2e6;
              }              .table-striped tbody tr:nth-of-type(odd) {
                background-color: rgba(0, 0, 0, 0.05);
              }
              .category-header {
                font-weight: bold;
                padding: 10px 15px !important;
              }
              .badge {
                display: inline-block;
                padding: 0.35em 0.65em;
                font-size: 0.75em;
                font-weight: 700;
                line-height: 1;
                color: #fff;
                text-align: center;
                white-space: nowrap;
                vertical-align: baseline;
                border-radius: 0.25rem;
              }
              /* Match the MaterialTakeoff component styling */
              .takeoff-category-inline {
                font-size: 0.7em;
                vertical-align: middle;
              }
              .material-table th {
                background-color: #f8f9fa;
                position: sticky;
                top: 0;
                z-index: 1;
                font-weight: 600;
              }
              @media print {
                .no-print {
                  display: none;
                }
                .table th, .table td {
                  background-color: white !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .table-striped tbody tr:nth-of-type(odd) td {
                  background-color: #f2f2f2 !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            <div class="container-fluid">
              <div class="row mb-3">
                <div class="col">
                  <h2>Material Takeoff</h2>
                </div>
                <div class="col-auto">
                  <button class="btn btn-primary no-print" onclick="window.print()">Print</button>
                </div>
              </div>
                <div class="table-responsive">
                <table class="table table-striped table-bordered material-table">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Quantity</th>
                      <th>Size</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableContent}
                  </tbody>
                </table>
              </div>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for styles to load before printing
      setTimeout(() => {
        // Let the user control the printing from the new window
        // The window has a print button they can use when ready
      }, 250);
    }
  };

  // File operations
  const handleNewDocument = useCallback(() => {
    setBuildingData(defaultBuildingData);
    setCurrentFilePath(null);
    setIsDocumentModified(false);
    setOriginalBuildingData(defaultBuildingData);
  }, [defaultBuildingData]);

  const handleOpenDocument = useCallback(async () => {
    try {
      const result = await ipcRenderer.invoke('open-file-dialog');
      if (result.canceled) return;

      const filePath = result.filePaths[0];
      const fileContent = await ipcRenderer.invoke('read-file', filePath);

      const parsedData = JSON.parse(fileContent);
      setBuildingData(parsedData);
      setCurrentFilePath(filePath);
      setIsDocumentModified(false);
      setOriginalBuildingData(parsedData);

      // Update material takeoff
      setTimeout(() => {
        const takeoff = generateMaterialTakeoff(parsedData);
        setMaterialTakeoff(takeoff);
      }, 100);

      // Add to recent files
      await ipcRenderer.invoke('add-recent-file', filePath);
    } catch (error) {
      console.error('Error opening file:', error);
      alert(`Error opening file: ${error}`);
    }
  }, []);

  const handleOpenRecentDocument = useCallback(async (filePath: string) => {
    try {
      const fileContent = await ipcRenderer.invoke('read-file', filePath);

      const parsedData = JSON.parse(fileContent);
      setBuildingData(parsedData);
      setCurrentFilePath(filePath);
      setIsDocumentModified(false);
      setOriginalBuildingData(parsedData);

      // Update material takeoff
      setTimeout(() => {
        const takeoff = generateMaterialTakeoff(parsedData);
        setMaterialTakeoff(takeoff);
      }, 100);
    } catch (error) {
      console.error('Error opening recent file:', error);
      alert(`Error opening file: ${error}\nThe file may have been moved or deleted.`);
      // Remove from recent files if it doesn't exist
      await ipcRenderer.invoke('remove-recent-file', filePath);
    }
  }, []);

  const handleSaveDocument = useCallback(async () => {
    try {
      if (!currentFilePath) {
        // If no file path, trigger save as
        return handleSaveDocumentAs();
      }

      const fileContent = JSON.stringify(buildingData, null, 2);
      await ipcRenderer.invoke('write-file', currentFilePath, fileContent);
      setIsDocumentModified(false);
      setOriginalBuildingData(buildingData);
      await ipcRenderer.invoke('add-recent-file', currentFilePath);

      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      alert(`Error saving file: ${error}`);
      return false;
    }
  }, [buildingData, currentFilePath]);

  const handleSaveDocumentAs = useCallback(async () => {
    try {
      const result = await ipcRenderer.invoke('save-file-dialog');
      if (result.canceled) return false;

      let filePath = result.filePath;
      // Add .mwj extension if not present
      if (!filePath.toLowerCase().endsWith('.mwj')) {
        filePath += '.mwj';
      }

      const fileContent = JSON.stringify(buildingData, null, 2);
      await ipcRenderer.invoke('write-file', filePath, fileContent);

      setCurrentFilePath(filePath);
      setIsDocumentModified(false);
      setOriginalBuildingData(buildingData);

      // Add to recent files
      await ipcRenderer.invoke('add-recent-file', filePath);

      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      alert(`Error saving file: ${error}`);
      return false;
    }
  }, [buildingData]);

  const handleRevertDocument = useCallback(() => {
    if (currentFilePath) {
      setBuildingData(originalBuildingData);
      setIsDocumentModified(false);

      // Update material takeoff
      setTimeout(() => {
        const takeoff = generateMaterialTakeoff(originalBuildingData);
        setMaterialTakeoff(takeoff);
      }, 100);
    }
  }, [currentFilePath, originalBuildingData]);

  // Set up window title based on file state
  useEffect(() => {
    const fileName = currentFilePath ? currentFilePath.split(/[/\\]/).pop() : 'Untitled';
    const modifiedIndicator = isDocumentModified ? '*' : '';
    document.title = `${modifiedIndicator}${fileName} - MetalWorks`;
  }, [currentFilePath, isDocumentModified]);

  // Handle initial app loading
  useEffect(() => {
    // Simulate app loading time
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 2000); // Adjust loading time as needed

    return () => clearTimeout(timer);
  }, []);

  // Auto-generate takeoff on initial render and when key building parameters change
  useEffect(() => {
    if (!appLoading) {
      const takeoff = generateMaterialTakeoff(buildingData);
      setMaterialTakeoff(takeoff);
    }
  }, [
    buildingData.length,
    buildingData.width,
    buildingData.height,
    buildingData.bays,
    buildingData.roofType,
    buildingData.roofPitch,
    appLoading
  ]);

  useEffect(() => {
    if (buildingData.insulation.enabled) {
      // Make a deep clone to avoid reference issues
      const updatedWalls = JSON.parse(JSON.stringify(buildingData.walls));
      let hasChanges = false;
      
      // Default behavior based on insulation type
      const insulationType = buildingData.insulation.type;
      
      // Update each wall's door/window settings
      Object.keys(updatedWalls).forEach(wallKey => {
        const wall = updatedWalls[wallKey];
        
        // For new entries with undefined subtractInsulation
        // Regular doors
        if (wall.doors) {
          wall.doors.forEach(door => {
            if (door.subtractInsulation === undefined) {
              door.subtractInsulation = insulationType === 'spray';
              hasChanges = true;
            }
          });
        }
        
        // Windows
        if (wall.windows) {
          wall.windows.forEach(window => {
            if (window.subtractInsulation === undefined) {
              window.subtractInsulation = insulationType === 'spray';
              hasChanges = true;
            }
          });
        }
        
        // Bay doors (always true by default)
        if (wall.bayDoors) {
          wall.bayDoors.forEach(door => {
            if (door.subtractInsulation === undefined) {
              door.subtractInsulation = true;
              hasChanges = true;
            }
          });
        }
        
        // Openings (always true by default)
        if (wall.openings) {
          wall.openings.forEach(opening => {
            if (opening.subtractInsulation === undefined) {
              opening.subtractInsulation = true;
              hasChanges = true;
            }
          });
        }
      });
      
      if (hasChanges) {
        setBuildingData(prev => ({
          ...prev,
          walls: updatedWalls
        }));
      }
    }
  }, [buildingData.insulation.enabled, buildingData.insulation.type]);

  useEffect(() => {
    // Listen for close requests from the main process
    if (ipcRenderer) {
      const handleCloseRequest = () => {
        console.log('Received close request from main process');
        if (isDocumentModified) {
          // Show confirmation dialog through the MenuBar component
          // You may need to add a ref or callback to trigger this
          // For now, let's just use a custom event
          document.dispatchEvent(new CustomEvent('app-close-requested'));
        } else {
          // No unsaved changes, safe to close
          ipcRenderer.send('confirm-close-app');
        }
      };
      
      ipcRenderer.on('app-close-requested', handleCloseRequest);
      
      return () => {
        ipcRenderer.removeListener('app-close-requested', handleCloseRequest);
      };
    }
  }, [isDocumentModified]);

  if (appLoading) {
    return (
      <div className="app-loading-overlay">
        <div className="app-loading-content">
          <Spinner animation="border" variant="primary" />
          <h3 className="mt-3">Loading MetalWorks</h3>
          <p>Initializing application...</p>
        </div>
      </div>
    );
  }

  // Extract file name from path
  const documentName = currentFilePath ? currentFilePath.split(/[/\\]/).pop() : null;

  return (
    <>
      <MenuBar
        documentName={documentName}
        isDocumentModified={isDocumentModified}
        onNew={handleNewDocument}
        onOpen={handleOpenDocument}
        onSave={handleSaveDocument}
        onSaveAs={handleSaveDocumentAs}
        onRevert={handleRevertDocument}
        onOpenRecent={handleOpenRecentDocument}
      />

      <Container fluid className='overflow-hidden'>
        <Row>
          <Col md={6} className="vh-100 overflow-y-scroll">
            <h4 className="mt-3 mb-4">Building Configuration</h4>
            <Form onSubmit={handleSubmit}>
              <BuildingDimensions
                data={{
                  length: buildingData.length,
                  width: buildingData.width,
                  height: buildingData.height,
                  bays: buildingData.bays,
                  structuralFrames: buildingData.structuralFrames
                }}
                updateField={updateField}
              />

              <RoofOptions 
                data={{
                  type: buildingData.roofType,
                  pitch: buildingData.roofPitch,
                  purlins: buildingData.purlins
                }} 
                updateField={updateField}
                buildingWidth={buildingData.width}
              />

              <InsulationOptions 
                data={buildingData.insulation}
                updateField={updateField}
                buildingData={buildingData}
              />

              <PanelingOptions
                data={{
                  panelType: buildingData.panelType,
                  wallColor: buildingData.wallColor,
                  trimColor: buildingData.trimColor,
                  roofColor: buildingData.roofColor
                }}
                updateField={updateField}
              />

              <WallOptions
                data={{ walls: buildingData.walls }}
                updateField={updateField}
                buildingWidth={buildingData.width}
                buildingLength={buildingData.length}
                buildingHeight={buildingData.height}
                roofType={buildingData.roofType}
                bays={buildingData.bays}
                insulation={buildingData.insulation}
              />
            </Form>
          </Col>

          <Col md={6} className="vh-100 overflow-y-scroll">
            <div className="d-flex justify-content-between align-items-center sticky-top bg-white pt-3 pb-2 mb-3 border-bottom">
              <h4 className="m-0">Material Takeoff</h4>
              <ButtonGroup>                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  className="px-3"
                >
                  <FaSync className="me-1" /> Generate
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePrint}
                  className="px-3"
                  disabled={!materialTakeoff}
                >
                  <FaPrint className="me-1" /> Print
                </Button>                <Button
                  variant="primary"
                  onClick={handleCopyList}
                  className="px-3"
                  disabled={!materialTakeoff}
                >
                  <FaCopy className='me-1' /> Copy
                </Button>
                <Button
                  variant="primary"
                  onClick={handleExport}
                  className="px-3"
                  disabled={!materialTakeoff}
                >
                  <FaArrowAltCircleRight className="me-1" /> Export
                </Button>
              </ButtonGroup>
            </div>
            <MaterialTakeoff takeoff={materialTakeoff} />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
