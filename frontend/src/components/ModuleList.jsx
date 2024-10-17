import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './ModuleAdmin.css';

const AdminModuleList = () => {
    const [modules, setModules] = useState([]);
    const navigate = useNavigate();
    const isDevelopment = import.meta.env.MODE === "development";
    const baseUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

    const backendUrl = baseUrl;

    // Fetch modules from the API when the component mounts
    useEffect(() => {
        const fetchModules = async () => {
            const response = await fetch(`${backendUrl}/api/modules/`);
            const data = await response.json();
            console.log(data)
            setModules(data);
        };
        fetchModules();
    }, []);

    // Handle navigation to the edit page
    const handleEdit = (moduleId) => {
        navigate(`/admin/modules/edit/${moduleId}`);
    };

    return (
        <div className="admin-container">
            <Sidebar />
            <div className="module-list">
                <h2 className='title'>Module List</h2>
                <br/>
                {/* Add Module button */}
                <button className="addModule" onClick={() => navigate('/admin/modules/add')}>Add New Module</button>
                <br/>
                <br/>
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
    );
};

export default AdminModuleList;
