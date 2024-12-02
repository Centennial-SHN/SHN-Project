// AddModule.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import ChangePasswordModal from './ChangePasswordModal';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from '../constants.js';
import { Button, Typography, Layout, Space, Select, Form, Card, Input, Upload, message } from 'antd';
import NavBar from "./NavBar";
import { InboxOutlined } from '@ant-design/icons';

const { Title, Link } = Typography;
const { Content } = Layout;
const { TextArea } = Input;
const { Dragger } = Upload;

const AddModule = () => {
    const [moduleName, setModuleName] = useState('');
    const [prompt, setPrompt] = useState('');
    const [voice, setVoice] = useState('alloy');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [caseAbstract, setCaseAbstract] = useState('');
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);
    const [model, setModel] = useState('gpt-4o-mini');
    const navigate = useNavigate();
    const isDevelopment = import.meta.env.MODE === "development";
    const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;
    const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
    const backendUrl = baseUrl;
    const isAdmin = sessionStorage.getItem('isSuperUser') === 'true';

    const [menuOpen, setMenuOpen] = useState(false); // State for toggling the menu
    const [iconColor, setIconColor] = useState("black");

    const hasCheckedSuperuser = useRef(false);
    const csrfToken = Cookies.get('csrftoken');

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

    //upload file for dragger component
    const draggerHandleFileChange = (info) => {
        const newFiles = info.fileList.map(file => file.originFileObj || file);
        setFiles(newFiles);
    };

    const removeFile = (indexToRemove) => {
        const updatedFiles = files.filter((_, index) => index !== indexToRemove);
        setFiles(updatedFiles);

        // Reset the file input field after removal
        if (updatedFiles.length === 0 && fileInputRef.current) {
            fileInputRef.current.value = "";  // Clear the file input field
        }
    };

    //remove file for dragger component
    const draggerRemoveFile = (fileToRemove) => {
        setFiles(files.filter(file => file !== fileToRemove));
    };

    const uploadProps = {
        name: 'file',
        multiple: true,
        headers: {
            'X-CSRFToken': csrfToken,
        },
        onChange: draggerHandleFileChange,
        onRemove: draggerRemoveFile,
        fileList: files,
    };

    const handleSave = async (e) => {
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
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        try {
            const response = await fetch(`${backendUrl}/api/modules/add/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken,
                },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json(); // Get response data
                navigate('/admin/module-list'); // Adjust this URL based on your routing setup
            } else {
                message.error('Error adding module.');
                return;
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
        setMenuOpen((prev) => {
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

    return (
            <Layout className="layoutAddModule">
                <NavBar isAdmin={isAdmin} />
                <Content className="layoutAddModuleContent">
                    <Link onClick={() => navigate('/admin/module-list')}>Back to Module List</Link>
                    <Card bordered={false}>
                        <Title level={3} style={{ color: '#191e72', textAlign: 'left', marginBottom: '32px' }}>Add New Module</Title>
                        <Form layout="vertical" onFinish={handleSave}>

                            <Form.Item label="Module Name" required>
                                <Input
                                    value={moduleName}
                                    onChange={(e) => setModuleName(e.target.value)}
                                    placeholder="Enter Module Name"
                                />
                            </Form.Item>
                            <Form.Item label="Model">
                                <Select
                                    value={model}
                                    onChange={(value) => setModel(value)}
                                    placeholder="Select Model"
                                    options={[
                                        {
                                            value: 'gpt-4o-mini',
                                            label: 'gpt-4o-mini',
                                        },
                                        {
                                            value: 'gpt-4o',
                                            label: 'gpt-4o',
                                        },
                                    ]}
                                />
                            </Form.Item>
                            <Form.Item label="Prompt" required>
                                <TextArea
                                    rows={4}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Enter Prompt"
                                />
                            </Form.Item>
                            <Form.Item label="Voice">
                                <Select
                                    value={voice}
                                    onChange={(value) => setVoice(value)}
                                    placeholder="Select Voice"
                                    options={[
                                        {
                                            value: 'alloy',
                                            label: 'alloy',
                                        },
                                        {
                                            value: 'nova',
                                            label: 'nova',
                                        },
                                        {
                                            value: 'shimmer',
                                            label: 'shimmer',
                                        },
                                        {
                                            value: 'onyx',
                                            label: 'onyx',
                                        },
                                        {
                                            value: 'fable',
                                            label: 'fable',
                                        },
                                        {
                                            value: 'echo',
                                            label: 'echo',
                                        },
                                    ]}
                                />
                            </Form.Item>
                            <Form.Item label="System Prompt" required>
                                <TextArea
                                    rows={4}
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    placeholder="Enter System Prompt"
                                />
                            </Form.Item>
                            <Form.Item label="Case Abstract" required>
                                <TextArea
                                    rows={4}
                                    value={caseAbstract}
                                    onChange={(e) => setCaseAbstract(e.target.value)}
                                    placeholder="Enter Case Abstract"
                                />
                            </Form.Item>
                            <Form.Item label="File Attachment">
                                <Dragger {...uploadProps}>
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                    <p className="ant-upload-hint">
                                        Support for a single or bulk upload.
                                    </p>
                                </Dragger>
                            </Form.Item>
                            <Space direction='horizontal' size="small" style={{ width: 'min-content' }}>
                                <Button type="primary" htmlType='submit'>Add Module</Button>
                                <Button onClick={() => navigate('/admin/module-list')}>Cancel</Button>
                            </Space>
                        </Form>
                    </Card>
                </Content>
                <ChangePasswordModal
                    isOpen={isChangePasswordOpen}
                    onClose={toggleChangePasswordModal}
                    onChangePassword={handleChangePassword}
                />
            </Layout>
        // </>
    );
};

export default AddModule;
