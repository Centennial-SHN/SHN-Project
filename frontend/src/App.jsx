import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ModuleSelection from './components/ModuleSelection';
import Interview from './components/Interview';
import Register from './components/Register';
import Login from './components/Login';
import ModuleList from './components/ModuleList';
import AddModule from './components/AddModule';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/module" element={<ModuleSelection />} />
          <Route path="/interview/:moduleId" element={<Interview />} />
          <Route path="/admin/module-list" element={<ModuleList />} />
          <Route path="/admin/modules/add" element={<AddModule />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;