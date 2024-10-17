// Sidebar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';  // Optional: Add styles for the sidebar here

const Sidebar = () => {
    const navigate = useNavigate();

    return (
        <nav className="sidebar">
            <h3>Admin Menu</h3>
            <ul>
                <li onClick={() => navigate('/admin/module-list')}>Modules</li>
                <li onClick={() => navigate('/admin/user-logs')}>User Logs</li>
            </ul>
        </nav>
    );
};

export default Sidebar;
