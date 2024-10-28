import React, { useState, useEffect,useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import './ModuleAdmin.css';
import Cookies from 'js-cookie';
import ChangePasswordModal from './ChangePasswordModal';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from '../constants';

const AdminModuleList = () => {
    const [modules, setModules] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false); // State for toggling the menu
    const [iconColor, setIconColor] = useState("black");
    const navigate = useNavigate();
    const isDevelopment = import.meta.env.MODE === "development";
    const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;
    const backendUrl = baseUrl;
    const csrfToken = Cookies.get('csrftoken');
    const hasCheckedSuperuser = useRef(false);

    const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);

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
            const response = await fetch(`${backendUrl}/api/modules/`,{
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                credentials: 'include',
            });
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


      const toggleChangePasswordModal = () => {
        setChangePasswordOpen(!isChangePasswordOpen);
      };
    
      // Function to handle password change
      const handleChangePassword = async (currentPassword, newPassword) => {
        try {
          const response = await fetch(`${backendUrl}/api/change-password/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({
              current_password: currentPassword,
              new_password: newPassword,
            }),
          });
    
          if (!response.ok) {
            throw new Error("Failed to change password");
          }
    
          alert("Password changed successfully!");
          setChangePasswordOpen(false);
        } catch (error) {
          console.error("Error changing password:", error);
          alert("Failed to change password. Please try again.");
        }
      };

      const handleDelete = async (moduleId) => {
        if (window.confirm("Are you sure you want to delete this module?")) {
            try {
                const response = await fetch(`${backendUrl}/api/modules/${moduleId}/`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });
    
                if (!response.ok) {
                    throw new Error('Failed to delete module');
                }
    
                setModules((prevModules) => prevModules.filter((module) => module.moduleid !== moduleId));
                alert("Module deleted successfully!");
            } catch (error) {
                console.error("Error deleting module:", error);
                alert("Failed to delete module. Please try again.");
            }
        }
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
                    <li onClick={toggleChangePasswordModal}>Change Password</li>
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
                                    <button className="btndelete" onClick={() => handleDelete(module.moduleid)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={toggleChangePasswordModal}
                onChangePassword={handleChangePassword}
            />
        </div>
    );
};

export default AdminModuleList;
