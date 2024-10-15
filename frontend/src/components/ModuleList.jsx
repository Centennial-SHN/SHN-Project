import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
            <nav className="sidebar">
                <h3>Admin Menu</h3>
                <ul>
                    <li onClick={() => navigate('/admin/module-list')}>Modules</li>
                    <li onClick={() => navigate('/admin/user-logs')}>User Logs</li>
                </ul>
            </nav>
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
                                    <button onClick={() => handleEdit(module.module_id)}>Edit</button>
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
