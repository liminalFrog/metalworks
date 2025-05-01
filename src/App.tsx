import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import BuildingDimensions from './components/BuildingDimensions';
import RoofOptions from './components/RoofOptions';
import ColorOptions from './components/ColorOptions';
import WallOptions from './components/WallOptions';
import MaterialTakeoff from './components/MaterialTakeoff';
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
    doors: [],
    windows: [],
    bayDoors: [],
    openings: [],
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

  const [buildingData, setBuildingData] = useState({
    // Building dimensions
    length: 40,
    width: 40,
    height: 12,
    bays: 2,
    
    // Roof options
    roofType: 'gable',
    roofPitch: 3,
    
    // Color options
    wallColor: 'white',
    trimColor: 'lightGray',
    roofColor: 'galvalume',
    
    // Wall options (per wall) - use function to create fresh copies
    walls: {
      north: createWallConfig(),
      east: createWallConfig(),
      south: createWallConfig(),
      west: createWallConfig()
    },
    
    // Legacy options for compatibility
    gutters: 'yes',
    manDoors: [{width: 3, height: 7}],
    rollUpDoors: [
      {width: 16, height: 10},
      {width: 10, height: 10},
      {width: 10, height: 10}
    ],
    windows: [],
    awnings: []
  });
  
  const [materialTakeoff, setMaterialTakeoff] = useState('');
  const [appLoading, setAppLoading] = useState(true);

  // Update this function to properly handle nested updates
  const updateField = (field: string, value: any) => {
    setBuildingData(prev => {
      // Make a deep copy for the walls to ensure each wall's settings remain independent
      if (field === 'walls') {
        return {
          ...prev,
          walls: value  // This is already a new object from WallOptions
        };
      }
      
      // For other fields
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const takeoff = generateMaterialTakeoff(buildingData);
    setMaterialTakeoff(takeoff);
  };

  // Handle initial app loading
  useEffect(() => {
    // Simulate app loading time (remove this in production)
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 2000); // You can adjust this or remove the timeout in production
    
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
    appLoading // Don't run this until app is loaded
  ]);

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

  return (
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
                bays: buildingData.bays
              }} 
              updateField={updateField} 
            />
            
            <RoofOptions 
              data={{
                type: buildingData.roofType,
                pitch: buildingData.roofPitch
              }} 
              updateField={updateField} 
            />
            
            <ColorOptions 
              data={{
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
            />
            
            <Button type="submit" variant="success" className="mb-4">Generate Material Takeoff</Button>
          </Form>
        </Col>
        
        <Col md={6} className="vh-100 overflow-y-scroll">
          <MaterialTakeoff takeoff={materialTakeoff} />    
        </Col>
      </Row>
    </Container>
  );
}

export default App;
