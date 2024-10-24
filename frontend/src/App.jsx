import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ModuleSelection from './components/ModuleSelection';
import Interview from './components/Interview';
import Register from './components/Register';
import Login from './components/Login';
import ModuleList from './components/ModuleList';
import AddModule from './components/AddModule';
import EditModule from './components/EditModule';
import InterviewHistory from './components/InterviewHistory';
import { ConfigProvider } from 'antd';

function App() {
  return (
    //Customizing the Ant Design theme here
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "'Montserrat', sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
          colorPrimary: '#49c6b9', //Teal
          colorTextBase: '#1D1E3A', //Black
          colorBgBase: '#fff', //White
          colorSuccess: '#5DE5B5', //Success
          colorWarning: '#FEB934', //Warning
          colorError: '#F8494F', //Error
          colorInfo: '#357CED', //Info
          colorLink: '#49c6b9', //Teal
          colorLinkHover: '#6FD2C8',
          colorTextPlaceholder: '#A6A8B9',
          linkDecoration: 'underline',
          borderRadius: 8,
          borderRadiusLG: 16,
          controlHeight: 40,
          boxShadow: "0 4px 4px 0 #F5F5F5, 0 4px 8px 8px rgba(245, 245, 245, 0.5)",

          //Custom Colors
          primaryTeal: '#49c6b9', //Teal
          primaryNavy: '#191e72', //Navy Blue
          secondaryCoral: '#f96065', //Coral
          secondaryYellow: '#fec24d', //Yellow
          secondaryGrey: '#3a3a3c', //Grey
          globalBlack: '#1D1E3A', //Black
          globalWhite: '#fff', //White
          globalGrey1: '#F1F2F3', //Grey 1
          globalGrey2: '#D8D9DE', //Grey 2
          globalGrey3: '#C1C2CD', //Grey 3
          globalGrey4: '#A6A8B9', //Grey 4
          globalGrey5: '#8E8FA9', //Grey 5
          globalGrey6: '#717398', //Grey 6
          globalGrey7: '#5C5E84', //Grey 7
          globalGrey8: '#474A6B', //Grey 8
          globalGrey9: '#343655', //Grey 9
          statusSuccess: '#5DE5B5', //Success
          statusWarning: '#FEB934', //Warning
          statusError: '#F8494F', //Error
          statusInfo: '#357CED', //Info
        },
      }}
    >
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
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;