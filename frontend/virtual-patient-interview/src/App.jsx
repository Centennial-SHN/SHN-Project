import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ModuleSelection from './components/ModuleSelection';
import Interview from './components/Interview';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<ModuleSelection />} />
          <Route path="/interview/:moduleId" element={<Interview />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;