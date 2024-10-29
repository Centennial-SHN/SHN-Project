import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ModuleSelection from './components/ModuleSelection';
import Interview from './components/Interview';
import Register from './components/Register';
import Login from './components/Login';
import ModuleList from './components/ModuleList';
import AddModule from './components/AddModule';
import EditModule from './components/EditModule';
import InterviewHistory from './components/InterviewHistory';
import 'antd/dist/reset.css';
import { ThemeProvider } from './themeConfig';
import UserAdmin from './components/UserAdmin';
import UserManagement from './components/UserManagement';
import InterviewComplete from './components/InterviewComplete';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/module" element={<ModuleSelection />} />
            <Route path="/interview/:moduleId" element={<Interview />} />
            <Route path="/interview-history/:userid" element={<InterviewHistory />} />
            <Route path="/admin/module-list" element={<ModuleList />} />
            <Route path="/admin/modules/add" element={<AddModule />} />
            <Route path="/admin/modules/edit/:moduleid" element={<EditModule />} />
            <Route path="/admin/user-logs" element={<UserAdmin />} />
            <Route path="/admin/manage-user/:userId" element={<UserManagement />} />
            <Route path="/interview-complete" element={<InterviewComplete />} />
        </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;