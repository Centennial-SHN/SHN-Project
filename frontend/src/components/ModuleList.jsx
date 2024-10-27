import React, { useState, useEffect,useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import './ModuleAdmin.css';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from '../constants';

const AdminModuleList = () => {
    const [modules, setModules] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false); // State for toggling the menu
    const [iconColor, setIconColor] = useState("black");
    const navigate = useNavigate();
    const isDevelopment = import.meta.env.MODE === "development";
    const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;
    const backendUrl = baseUrl;

    const hasCheckedSuperuser = useRef(false);

    const checkSuperuser = () => {
        const storedIsSuperuser = sessionStorage.getItem("isSuperUser");
        const storedUserId = sessionStorage.getItem("userId");

        if (!storedIsSuperuser || storedIsSuperuser !== "true" || !storedUserId) {
            alert('Only admins are allowed to access this page.');
            navigate("/");
            return true;
        }
        return false;
    };

    useEffect(() => {
        if (!hasCheckedSuperuser.current) {
            hasCheckedSuperuser.current = true;
            if (checkSuperuser()) return;
        }
        
        const fetchModules = async () => {
            const response = await fetch(`${backendUrl}/api/modules/`);
            const data = await response.json();
            console.log(data)
            setModules(data);
        };
        fetchModules();
    }, [navigate, backendUrl]);

    
    const handleLogout = () => {
        sessionStorage.removeItem("userId"); // Clear userId from sessionStorage
        navigate("/"); // Redirect to login page
      };

    const handleEdit = (moduleId) => {
        navigate(`/admin/modules/edit/${moduleId}`);
    };

    const toggleMenu = () => {
        setMenuOpen((prev) =>{
          setIconColor(prev ? "black" : "#4DBDB1");
          return !prev;
        });
      };

    return (
        <div className="admin-container">
            <header>
                <nav>
                <div className="hamburger" onClick={toggleMenu}>
                    <FontAwesomeIcon icon={faBars} size="2x" color={iconColor} /> {/* Use iconColor state */}
                </div>
                <ul className={`nav-menu ${menuOpen ? "show" : ""}`}>
                    <li onClick={() => navigate('/admin/module-list')}>Modules</li>
                    <li onClick={() => navigate('/admin/user-logs')}>User Logs</li>
                    <li onClick={() => navigate(`/module`)}>Switch to user</li>
                    <li onClick={() => navigate("/reset-password")}>Reset Password</li>
                    <li onClick={handleLogout}>Logout</li>
                </ul>
                </nav>
            </header>
            {/* <Sidebar /> */}
            <div className="module-list">
                <div className='header'>
                <h2 className='title'>Module List</h2>
                <br/>
                {/* Add Module button */}
                <button className="addModule" onClick={() => navigate('/admin/modules/add')}>Add New Module</button>
                </div>
                <br/>
                <br/>
                <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Module ID</th>
                            <th>Module Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {modules.map((module) => (
                            <tr key={module.moduleid}>
                                <td>{module.moduleid}</td>
                                <td>{module.modulename}</td>
                                <td>
                                    <button onClick={() => handleEdit(module.moduleid)}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
};

export default AdminModuleList;
