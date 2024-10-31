import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import "./ModuleAdmin.css";
import { faTrash, faFileAlt } from "@fortawesome/free-solid-svg-icons";
import Sidebar from "./Sidebar.jsx";
import Cookies from "js-cookie";
import ChangePasswordModal from "./ChangePasswordModal";
import {
  VITE_API_BASE_URL_LOCAL,
  VITE_API_BASE_URL_PROD,
} from "../constants.js";
import {
  Button,
  Typography,
  Layout,
  Space,
  Select,
  Form,
  Card,
  Input,
  Upload,
  message,
} from "antd";
import NavBar from "./NavBar";
import { InboxOutlined } from "@ant-design/icons";

const { Title, Text, Link } = Typography;
const { Content } = Layout;
const { TextArea } = Input;
const { Dragger } = Upload;

const EditModule = () => {
  const { moduleid } = useParams(); // Get moduleid from URL parameters
  const [moduleName, setModuleName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [voice, setVoice] = useState("Alloy");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [caseAbstract, setCaseAbstract] = useState("");
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const navigate = useNavigate();
  const isDevelopment = import.meta.env.MODE === "development";
  const baseUrl = isDevelopment
    ? VITE_API_BASE_URL_LOCAL
    : VITE_API_BASE_URL_PROD;
  const backendUrl = baseUrl;
  const csrfToken = Cookies.get("csrftoken");

  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // State for toggling the menu
  const [iconColor, setIconColor] = useState("black");
  const isAdmin = sessionStorage.getItem("isSuperUser") === "true";

  const hasCheckedSuperuser = useRef(false);

  const checkSuperuser = () => {
    const storedIsSuperuser = sessionStorage.getItem("isSuperUser");
    const storedUserId = sessionStorage.getItem("userId");

    if (!storedIsSuperuser || storedIsSuperuser !== "true" || !storedUserId) {
      alert("Only admins are allowed to access this page.");
      navigate("/");
      return true;
    }
    return false;
  };

  // Fetch existing module data on mount
  useEffect(() => {
    if (!hasCheckedSuperuser.current) {
      hasCheckedSuperuser.current = true;
      if (checkSuperuser()) return;
    }

    const fetchModule = async () => {
      const response = await fetch(
        `${backendUrl}/api/modules/edit/${moduleid}/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
        }
      );
      const data = await response.json();
      if (response.ok) {
        setModuleName(data.modulename);
        setPrompt(data.prompt);
        setVoice(data.voice);
        setSystemPrompt(data.system_prompt);
        setCaseAbstract(data.case_abstract);
        setModel(data.model);
        const formattedFiles = Object.entries(data.file || {}).map(
          ([filename, url], index) => ({
            uid: index,
            name: filename,
            status: "done",
            url: url,
          })
        );
        setFiles(formattedFiles);
      } else {
        alert(data.error || "Error fetching module data.");
      }
    };
    fetchModule();
  }, [moduleid]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSave = async (e) => {
    //e.preventDefault();

    const formData = new FormData();
    formData.append("modulename", moduleName);
    formData.append("prompt", prompt);
    formData.append("voice", voice);
    formData.append("system_prompt", systemPrompt);
    formData.append("case_abstract", caseAbstract);
    formData.append("model", model);
    files.forEach((file) => {
      formData.append("file", file);
    });
    const response = await fetch(
      `${backendUrl}/api/modules/edit/${moduleid}/`,
      {
        method: "PUT",
        body: formData,
        headers: {
          // 'Content-Type': 'application/json',
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
      }
    );

    if (response.ok) {
      //message.success("Module updated successfully!");
      navigate("/admin/module-list"); // Redirect to the module list after saving
    } else {
      //const data = await response.json();
      message.error("Error updating module.");
      return;
    }
  };

  //   const handleFileDelete = async (filename) => {
  //     try {
  //       const encodedFilename = encodeURIComponent(filename);
  //       const response = await fetch(
  //         `${backendUrl}/api/modules/${moduleid}/files/${encodedFilename}/`,
  //         {
  //           method: "DELETE",
  //         }
  //       );

  //       if (response.ok) {
  //         setExistingFiles((prevFiles) =>
  //           prevFiles.filter(([name]) => name !== filename)
  //         );
  //         alert("File deleted successfully.");
  //       } else {
  //         const data = await response.json(); // Attempt to read JSON response
  //         console.error(
  //           "Failed to delete the file:",
  //           data.detail || response.statusText
  //         );
  //         alert(`Failed to delete file: ${data.detail || response.statusText}`);
  //       }
  //     } catch (error) {
  //       console.error("Error deleting file:", error);
  //       alert(`Error deleting file: ${error.message}`);
  //     }
  //   };

  const handleFileDelete = async (file) => {
    try {
      // Make sure the filename is encoded correctly
      const encodedFilename = encodeURIComponent(file.name);

      // Send DELETE request to backend
      const response = await fetch(
        `${backendUrl}/api/modules/${moduleid}/files/${encodedFilename}/`,
        {
          method: "DELETE",
          headers: {
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        // Update files state to remove deleted file
        setFiles((prevFiles) => prevFiles.filter((f) => f.name !== file.name));
        //message.success("File deleted successfully.");
      } else {
        const data = await response.json();
        console.error("Failed to delete the file:", data);
        //message.error("Failed to delete file.");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      //message.error("Error deleting file.");
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
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
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


  const uploadProps = {
    name: "file",
    multiple: true,
    headers: {
      "X-CSRFToken": csrfToken,
    },
    onChange(info) {
      const newFiles = info.fileList.map((file) => file.originFileObj || file);
      setFiles(newFiles);
    },
    fileList: files,
    onRemove: async (file) => {
      const success = await handleFileDelete(file);
      return success; 
    },
  };

  return (
    <Layout className="layoutEditModule">
      <NavBar isAdmin={isAdmin} />
      <Content className="layoutEditModuleContent">
        <Link onClick={() => navigate("/admin/module-list")}>
          Back to Module List
        </Link>
        <Card bordered={false}>
          <Title
            level={3}
            style={{
              color: "#191e72",
              textAlign: "left",
              marginBottom: "32px",
            }}
          >
            Edit Module
          </Title>
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
                    value: "gpt-4o-mini",
                    label: "gpt-4o-mini",
                  },
                  {
                    value: "gpt-4o",
                    label: "gpt-4o",
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
                    value: "alloy",
                    label: "alloy",
                  },
                  {
                    value: "nova",
                    label: "nova",
                  },
                  {
                    value: "shimmer",
                    label: "shimmer",
                  },
                  {
                    value: "onyx",
                    label: "onyx",
                  },
                  {
                    value: "fable",
                    label: "fable",
                  },
                  {
                    value: "echo",
                    label: "echo",
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
                <p
                  className="ant-upload-drag-icon"
                  onClick={() => {
                    handleFileDelete();
                  }}
                >
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag file to this area to upload
                </p>
                <p className="ant-upload-hint">
                  Support for a single or bulk upload.
                </p>
              </Dragger>
              
            </Form.Item>

            {/* <div className="form-group">
              <label>File attachments:</label>
              {existingFiles.length > 0 && (
                <ul className="file-list">
                  {existingFiles.map(([filename, url]) => (
                    <li key={filename}>
                      <FontAwesomeIcon icon={faFileAlt} color="#6c757d" />
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {filename}
                      </a>
                      <FontAwesomeIcon
                        icon={faTrash}
                        className="delete-icon"
                        onClick={() => handleFileDelete(filename)}
                      />
                    </li>
                  ))}
                </ul>
              )}
              <input type="file" onChange={handleFileChange} />
            </div> */}

            <Space
              direction="horizontal"
              size="small"
              style={{ width: "min-content" }}
            >
              <Button type="primary" htmlType="submit">
                Edit Module
              </Button>
              <Button onClick={() => navigate("/admin/module-list")}>
                Cancel
              </Button>
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
  );
};

export default EditModule;
