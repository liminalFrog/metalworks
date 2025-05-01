import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import BuildingDimensions from './components/BuildingDimensions';
import RoofOptions from './components/RoofOptions';
import ColorOptions from './components/ColorOptions';
import WallOptions from './components/WallOptions';
import MaterialTakeoff from './components/MaterialTakeoff';
import { generateMaterialTakeoff } from './calculations';
import './styles/App.scss';

// Default wall configuration template
const defaultWallConfig = {
  girts: {
    size: 'C2x6',
    spacing: [5, 10]
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
};

function App() {
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
    
    // Wall options (per wall)
    walls: {
      north: { ...defaultWallConfig },
      east: { ...defaultWallConfig },
      south: { ...defaultWallConfig },
      west: { ...defaultWallConfig }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const takeoff = generateMaterialTakeoff(buildingData);
    setMaterialTakeoff(takeoff);
  };

  const updateField = (field: string, value: any) => {
    setBuildingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-generate takeoff on initial render and when key building parameters change
  useEffect(() => {
    const takeoff = generateMaterialTakeoff(buildingData);
    setMaterialTakeoff(takeoff);
  }, [
    buildingData.length, 
    buildingData.width, 
    buildingData.height, 
    buildingData.bays,
    buildingData.roofType,
    buildingData.roofPitch
  ]);

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
