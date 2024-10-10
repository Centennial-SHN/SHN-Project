import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ModuleSelection = () => {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const navigate = useNavigate();  

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/modules/");
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

  const handleProceed = () => {
    if (selectedModule) {
      navigate(`/interview/${selectedModule}`); 
    } else {
      alert("Please select a module to proceed.");
    }
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
    </div>
  );
};

export default ModuleSelection;
