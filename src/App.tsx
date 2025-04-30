import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import BuildingDimensions from './components/BuildingDimensions';
import Gutters from './components/Gutters';
import DynamicFields from './components/DynamicFields';
import MaterialTakeoff from './components/MaterialTakeoff';
import { generateMaterialTakeoff } from './calculations';
import './styles/App.scss';

function App() {
  const [buildingData, setBuildingData] = useState({
    length: 40,
    width: 40,
    height: 12,
    pitch: 3,
    bays: 2,
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

  // Auto-generate takeoff on initial render
  useEffect(() => {
    const takeoff = generateMaterialTakeoff(buildingData);
    setMaterialTakeoff(takeoff);
  }, []);

  return (
    <Container className='overflow-hidden'>

      <Row>
        <Col md={6} className="vh-100 overflow-y-scroll">
          <Form onSubmit={handleSubmit}>
            <BuildingDimensions data={buildingData} updateField={updateField} />
            <Gutters data={buildingData.gutters} updateField={(value) => updateField('gutters', value)} />
            
            <DynamicFields 
              title="Man Doors" 
              items={buildingData.manDoors}
              updateItems={(items) => updateField('manDoors', items)}
              addItem={() => ({width: 3, height: 7})}
            />
            
            <DynamicFields 
              title="Roll-Up Doors" 
              items={buildingData.rollUpDoors}
              updateItems={(items) => updateField('rollUpDoors', items)}
              addItem={() => ({width: 10, height: 10})}
            />
            
            <DynamicFields 
              title="Windows" 
              items={buildingData.windows}
              updateItems={(items) => updateField('windows', items)}
              addItem={() => ({width: 4, height: 4})}
            />
            
            <DynamicFields 
              title="Awnings" 
              items={buildingData.awnings}
              updateItems={(items) => updateField('awnings', items)}
              addItem={() => ({width: 4, height: 2})}
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
