import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";
import NavBar from "./NavBar";
import { Button, Typography, Layout, Space, Select } from 'antd';

const { Title, Text } = Typography;
const { Content } = Layout;

const ModuleSelection = () => {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [iconColor, setIconColor] = useState("black");
  const userId = sessionStorage.getItem('userId');
  const isAdmin = sessionStorage.getItem('isSuperUser') === 'true';
  const isDevelopment = import.meta.env.MODE === "development";
  const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;

  const backendUrl = baseUrl;

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    const fetchModules = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/modules/`);
        const data = await response.json();
        setModules(data);
      } catch (error) {
        console.error("Error fetching modules:", error);
      }
    };

    fetchModules();
  }, []);

  const handleModuleChange = (value) => {
    setSelectedModule(value);
  };

  const handleProceed = async () => {
    if (selectedModule) {
      try {

        if (!userId) {
          alert("User is not logged in. Please log in first.");
          return;
        }
        const response = await fetch(`${backendUrl}/api/create_interview/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            module_id: selectedModule,
            user_id: userId
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create interview");
        }

        const data = await response.json();
        const interviewId = data.interviewid;

        // Navigate to interview page with interviewId and selectedModule
        navigate(`/interview/${selectedModule}`, { state: { interviewId, userId: userId } });


      } catch (error) {
        console.error("Error creating interview:", error);
      }
    } else {
      alert("Please select a module to proceed.");
    }
  };

  // const handleViewHistory = () => {
  //   navigate(`/interview-history/${userId}`);
  // };

  // const handleLogout = () => {
  //   sessionStorage.removeItem("userId"); // Clear userId from sessionStorage
  //   navigate("/"); // Redirect to login page
  // };

  // const toggleMenu = () => {
  //   setMenuOpen((prev) => {
  //     setIconColor(prev ? "black" : "#4DBDB1");
  //     return !prev;
  //   });
  // };

  // const handleSwitchToAdmin = () => {
  //   navigate("/admin/module-list"); // Replace with the actual admin route
  // };


  return (

    <Layout className="layoutModuleSelect">
      <NavBar isAdmin={isAdmin} />
      <Content className="layoutModSelContent">
        <Space direction="vertical" size="small">
        <Title level={3} style={{color: '#191e72',}}>Welcome to SHN Virtual Interviews</Title>
        <Text>Please select a model to start training with a virtual patient.</Text>
        </Space>
          {/* <label htmlFor="module-select"></label> */}
          <Select
            id="module-select"
            value={selectedModule}
            onChange={handleModuleChange}
            style={{width: '100%'}}
            options={modules.map((module) => ({
              value: module.moduleid,
              label: module.modulename,
            }))}
            placeholder="Please choose a module"
          >
            {/* <option value="">Please choose a module</option>
            {modules.map((module) => (
              <option key={module.moduleid} value={module.moduleid}>
                {module.modulename}
              </option>
            ))} */}
          </Select>
        <Button type="primary" onClick={handleProceed}>Start Interview</Button>
        {/* <button onClick={handleViewHistory}>View Interview History</button> */}
      </Content>
    </Layout>
  );
};

export default ModuleSelection;
