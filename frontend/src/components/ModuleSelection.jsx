import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";

const ModuleSelection = () => {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
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

  const handleLogout = () => {
    sessionStorage.removeItem("userId"); // Clear userId from sessionStorage
    navigate("/"); // Redirect to login page
  };

  const toggleMenu = () => {
    setMenuOpen((prev) =>{
      setIconColor(prev ? "black" : "#4DBDB1");
      return !prev;
    });
  };

  const handleSwitchToAdmin = () => {
    navigate("/admin/module-list"); // Replace with the actual admin route
  };


  return (
    <div className="module-selection">
      <header>
        <nav>
          <div className="hamburger" onClick={toggleMenu}>
            <FontAwesomeIcon icon={faBars} size="2x" color={iconColor}/>
          </div>
            <ul className={`nav-menu${menuOpen ? " show" : ""}`}>
              <li onClick={() => navigate(`/interview-history/${userId}`)}>Interview History</li>
              <li onClick={() => navigate("/reset-password")}>Reset Password</li>
              {isAdmin && ( // This line ensures the "Switch to Admin" item is shown only to admin users
                <li onClick={handleSwitchToAdmin}>Switch to Admin</li>
              )}
              <li onClick={handleLogout}>Logout</li>
            </ul>
        </nav>
      </header>
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
      {/* <button onClick={handleViewHistory}>View Interview History</button> */}
    </div>
  );
};

export default ModuleSelection;
