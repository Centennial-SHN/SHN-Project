import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ModuleAdmin.css';
import Sidebar from './Sidebar.jsx';

const EditModule = () => {
    const { moduleid } = useParams(); // Get moduleid from URL parameters
    const [moduleName, setModuleName] = useState('');
    const [prompt, setPrompt] = useState('');
    const [voice, setVoice] = useState('Alloy');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [caseAbstract, setCaseAbstract] = useState('');
    const [file, setFile] = useState(null);
    const [model, setModel] = useState('GPT-4-turbo');
    const navigate = useNavigate();
    const isDevelopment = import.meta.env.MODE === "development";
    const baseUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

    const backendUrl = baseUrl;

    // Fetch existing module data on mount
    useEffect(() => {
        const fetchModule = async () => {
            const response = await fetch(`${backendUrl}/api/modules/edit/${moduleid}/`);
            const data = await response.json();
            console.log(moduleid)
            if (response.ok) {
                setModuleName(data.modulename);
                setPrompt(data.prompt);
                setVoice(data.voice);
                setSystemPrompt(data.system_prompt);
                setCaseAbstract(data.case_abstract);
                setModel(data.model);
            } else {
                alert(data.error || 'Error fetching module data.');
            }
        };
        fetchModule();
    }, [moduleid]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('modulename', moduleName);
        formData.append('prompt', prompt);
        formData.append('voice', voice);
        formData.append('system_prompt', systemPrompt);
        formData.append('case_abstract', caseAbstract);
        if (file) {
            formData.append('file', file);
        }
        formData.append('model', model);

        const response = await fetch(`${backendUrl}/api/modules/edit/${moduleid}/`, {
            method: 'PUT',
            body: formData,
        });

        if (response.ok) {
            alert('Module updated successfully!');
            navigate('/admin/module-list'); // Redirect to the module list after saving
        } else {
            const data = await response.json();
            alert(data.error || 'Error updating module.');
        }
    };

    return (
        <div className="admin-container">
        <Sidebar />
        <form className="add-module" onSubmit={handleSave} encType="multipart/form-data">
            <h2>Edit Module</h2>
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
                <input type="file" onChange={handleFileChange} />
            </div>

            <div className="form-group">
                <label>Model:</label>
                <select value={model} onChange={(e) => setModel(e.target.value)}>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4">gpt-4</option>
                    <option value="gpt-4o Realtime">gpt-4o Realtime</option>
                </select>
            </div>

            <br />
            <div className="form-buttons">
                <button type="button" onClick={() => navigate('/admin/module-list')}>CANCEL</button>
                &nbsp;&nbsp;
                <button type="submit">SAVE</button>
            </div>
        </form>
        </div>
    );
};

export default EditModule;