// AddModule.jsx
import React, { useState,useEffect,useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import './ModuleAdmin.css';
import Sidebar from './Sidebar.jsx';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from '../constants.js';

const AddModule = () => {
    const [moduleName, setModuleName] = useState('');
    const [prompt, setPrompt] = useState('');
    const [voice, setVoice] = useState('Alloy');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [caseAbstract, setCaseAbstract] = useState('');
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);
    const [model, setModel] = useState('gpt-4o-mini');
    const navigate = useNavigate();
    const isDevelopment = import.meta.env.MODE === "development";
    const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;

    const backendUrl = baseUrl;

    const [menuOpen, setMenuOpen] = useState(false); // State for toggling the menu
    const [iconColor, setIconColor] = useState("black");

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
    }, []);

    const handleFileChange = (e) => {
        setFiles([...files, ...Array.from(e.target.files)]); // Append new files
    }
    const removeFile = (indexToRemove) => {
        const updatedFiles = files.filter((_, index) => index !== indexToRemove);
        setFiles(updatedFiles);

        // Reset the file input field after removal
        if (updatedFiles.length === 0 && fileInputRef.current) {
            fileInputRef.current.value = "";  // Clear the file input field
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('modulename', moduleName);
        formData.append('prompt', prompt);
        formData.append('voice', voice);
        formData.append('system_prompt', systemPrompt);
        formData.append('case_abstract', caseAbstract);
        
        // Append multiple files

        if (files && files.length > 0) {
            files.forEach((file) => {
                formData.append('file', file);  // Ensure each file is appended as 'file'
            });
        }

        formData.append('model', model);
        // Debugging: Log form data
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        try {
            const response = await fetch(`${backendUrl}/api/modules/add/`, {
                method: 'POST',
                body: formData,
            });
    
            if (response.ok) {
                const data = await response.json(); // Get response data
                alert('Module added successfully!');
                // Navigate to the modules list after successful addition
                navigate('/admin/module-list'); // Adjust this URL based on your routing setup
            } else {
                const data = await response.json();
                alert(data.error || 'Error adding module.');
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Network error. Please try again later.');
        }
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
                <li onClick={() => navigate('/module')}>Switch to user</li>
                <li onClick={() => navigate("/reset-password")}>Reset Password</li>
                <li onClick={handleLogout}>Logout</li>
            </ul>
            </nav>
        </header>
        {/* <Sidebar /> */}
        <div className='form-content'>
        <form className="add-module" onSubmit={handleSave}>
            <h2>Add New Module</h2>
                <div className="form-group">
                    <label>Module name:</label>
                    <input
                        type="text"
                        value={moduleName}
                        onChange={(e) => setModuleName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Prompt:</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                <label>Voice:</label>
                <select value={voice} onChange={(e) => setVoice(e.target.value)}>
                    <option value="alloy">alloy</option>
                    <option value="nova">nova</option>
                    <option value="shimmer">shimmer</option>
                    <option value="onyx">onyx</option>
                    <option value="fable">fable</option>
                    <option value="echo">echo</option>
                </select>
                </div>

                <div className="form-group">
                    <label>System prompt:</label>
                    <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Case abstract:</label>
                    <textarea
                        value={caseAbstract}
                        onChange={(e) => setCaseAbstract(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                        <label>File attachment:</label>
                        <input type="file" onChange={handleFileChange} multiple className="file-input" ref={fileInputRef} />
                        
                        {files.length > 0 && (
                            <ul className="file-list">
                                {files.map((file, index) => (
                                    <li key={index} className="file-item">
                                        <span className="file-name">{file.name}</span>
                                        <span
                                            className="remove-file-cross"
                                            onClick={() => removeFile(index)}
                                        >
                                            ✕
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>


                <div className="form-group">
                    <label>Model:</label>
                    <select value={model} onChange={(e) => setModel(e.target.value)}>
                        <option value="gpt-4o-mini">gpt-4o-mini</option>
                        <option value="gpt-4o">gpt-4o</option>
                    </select>
                </div>
                <br/>
                <div className="form-buttons">
                    <button type="button" onClick={() => navigate('/admin/module-list')}>CANCEL</button>
                    &nbsp;&nbsp;
                    <button type="submit">SAVE</button>
                </div>
        </form>
        </div>
        </div>
    );
};

export default AddModule;
