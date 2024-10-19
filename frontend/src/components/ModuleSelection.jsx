import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ModuleSelection = () => {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const navigate = useNavigate();  
  const userId = sessionStorage.getItem('userId');
  const isDevelopment = import.meta.env.MODE === "development";
  const baseUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

  const backendUrl = baseUrl;

  useEffect(() => {
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

  const handleModuleChange = (event) => {
    setSelectedModule(event.target.value);
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

  const handleViewHistory = () => {
    navigate(`/interview-history/${userId}`);
  };

  return (
    <div className="module-selection">
      <h1>Module</h1>
      <div>
        <label htmlFor="module-select"></label>
        <select
          id="module-select"
          value={selectedModule}
          onChange={handleModuleChange}
        >
            <option value="">Please choose a module</option>
          {modules.map((module) => (
            <option key={module.moduleid} value={module.moduleid}>
              {module.modulename}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleProceed}>Start</button>
      <br />
      <button onClick={handleViewHistory}>View Interview History</button>
    </div>
  );
};

export default ModuleSelection;
