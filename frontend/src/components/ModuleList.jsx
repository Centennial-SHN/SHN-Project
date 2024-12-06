import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import Cookies from "js-cookie";
import ChangePasswordModal from "./ChangePasswordModal";
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";
import {
  Button,
  Typography,
  Layout,
  Table,
  Col,
  Row,
  Modal,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Title } = Typography;

const AdminModuleList = () => {
  const [modules, setModules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const navigate = useNavigate();
  const isDevelopment = import.meta.env.MODE === "development";
  const baseUrl = isDevelopment
    ? VITE_API_BASE_URL_LOCAL
    : VITE_API_BASE_URL_PROD;
  const backendUrl = baseUrl;
  const csrfToken = Cookies.get("csrftoken");
  const hasCheckedSuperuser = useRef(false);
  const isAdmin = sessionStorage.getItem("isSuperUser") === "true";

  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);

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

  useEffect(() => {
    if (!hasCheckedSuperuser.current) {
      hasCheckedSuperuser.current = true;
      if (checkSuperuser()) return;
    }

    const fetchModules = async () => {
      const response = await fetch(`${backendUrl}/api/modules/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
      });
      const data = await response.json();
      setModules(data);
    };
    fetchModules();
  }, [navigate, backendUrl]);

  const handleEdit = (moduleId) => {
    navigate(`/admin/modules/edit/${moduleId}`);
  };


  const toggleChangePasswordModal = () => {
    setChangePasswordOpen(!isChangePasswordOpen);
  };

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

  const showDeleteModal = (moduleId) => {
    setSelectedModuleId(moduleId);
    setIsModalOpen(true);
  };

  const handleDeleteOk = async () => {
    setIsModalOpen(false);
    try {
      const response = await fetch(
        `${backendUrl}/api/modules/delete/${selectedModuleId}/`,
        {
          method: "DELETE",
          headers: {
            "X-CSRFToken": csrfToken,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete module");
      }

      setModules((prevModules) =>
        prevModules.filter((module) => module.moduleid !== selectedModuleId)
      );
    } catch (error) {
      console.error("Error deleting module:", error);
    }
    setSelectedModuleId(null);
  };

  const handleDeleteCancel = () => {
    setIsModalOpen(false);
  };

  const handleRedirectModule = () => {
    navigate(`/admin/modules/add`);
  };

  const columns = [
    {
      title: "Module ID",
      dataIndex: "moduleid",
      key: "moduleid",
      width: "33%",
      sorter: (a, b) => a.moduleid.localeCompare(b.moduleid),
    },
    {
      title: "Module Name",
      dataIndex: "modulename",
      key: "modulename",
      width: "34%",
      sorter: (a, b) => a.modulename.localeCompare(b.modulename),
    },
    {
      title: "Action",
      key: "action",
      width: "33%",
      render: (_, record) => (
        <Row 
            justify="center"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              width: "100%",
            }}
        >
          <Col>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record.moduleid)}
              style={{
                width: "140px",
                height: "40px",
                padding: "0 16px",
              }}
            >
              Edit
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<DeleteOutlined />}
              className="delete-button"
              onClick={() => showDeleteModal(record.moduleid)}
              style={{
                width: "140px",
                height: "40px",
                padding: "0 16px",
              }}
            >
              Delete
            </Button>
          </Col>
        </Row>
      ),
    },
  ];

  const dataSource = modules.map((module, index) => ({
    key: index,
    moduleid: module.moduleid,
    modulename: module.modulename,
  }));

  return (
    <Layout className="layoutModuleList">
      <NavBar isAdmin={isAdmin} />
      <Content className="layoutModuleListContent">
        <Row align="middle" justify="space-between" style={{
           width: "100%",
           flexWrap: "wrap"
          }}>
          <Col style={{ flexBasis: "100%" }}>
            <Title level={3}
              className="module-list-title"
              style={{ 
              color: "#191E72",
              whiteSpace: "normal",
              textAlign: "left",
             }}>
              Module List
            </Title>
          </Col>
          <Col>
            <Button type="primary" 
              onClick={handleRedirectModule} 
              className="module-list-button"
              style={{ width: "100%" }}
              >
              Add New Module
            </Button>
          </Col>
        </Row>
        <Table
          dataSource={dataSource}
          columns={columns}
          size="large"
          pagination={
            dataSource.length > 10
              ? {
                  pageSize: pageSize,
                  showSizeChanger: true,
                  onShowSizeChange: (current, size) => setPageSize(size),
                  pageSizeOptions: ["10", "20", "30", "50"],
                }
              : false
          }
          showSorterTooltip={{
            target: "sorter-icon",
          }}
        />

        <Modal
          open={isModalOpen}
          onOk={handleDeleteOk}
          onCancel={handleDeleteCancel}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ className: "delete-button" }}
        >
          <p>
            <strong>Are you sure you want to delete this module?</strong>
          </p>
        </Modal>

        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={toggleChangePasswordModal}
          onChangePassword={handleChangePassword}
        />
      </Content>
    </Layout>
  );
};

export default AdminModuleList;
