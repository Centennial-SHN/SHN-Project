// AddModule.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddModule.css';

const AddModule = () => {
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

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('module_name', moduleName);
        formData.append('prompt', prompt);
        formData.append('voice', voice);
        formData.append('system_prompt', systemPrompt);
        formData.append('case_abstract', caseAbstract);
        formData.append('file', file);
        formData.append('model', model);

        const response = await fetch(`${backendUrl}/api/modules/add/`, {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            alert('Module added successfully!');
            navigate('/admin/module-list'); // Redirect to the module list after saving
        } else {
            const data = await response.json();
            alert(data.error || 'Error adding module.');
        }
    };

    return (
        // <div className="add-module">
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
                        <option value="Alloy">Alloy</option>
                        <option value="Nova">Nova</option>
                        <option value="Shimmer">Shimmer</option>
                        <option value="Onyx">Onyx</option>
                        <option value="Fable">Fable</option>
                        <option value="Echo">Echo</option>
                        <option value="Alloy">Alloy</option>
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
                        <option value="GPT-4-turbo">gpt-4-turbo</option>
                        <option value="GPT-4-turbo">gpt-4o</option>
                        <option value="GPT-4-turbo">gpt-4</option>
                        <option value="GPT-4-turbo">gpt-4o Realtime</option>
                    </select>
                </div>
                <br/>
                <div className="form-buttons">
                    <button type="button" onClick={() => navigate('/admin/module-list')}>CANCEL</button>
                    &nbsp;&nbsp;
                    <button type="submit">SAVE</button>
                </div>
            </form>
        // </div>
    );
};

export default AddModule;
