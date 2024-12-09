import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MenuOutlined } from '@ant-design/icons';
import { Typography, Layout, Space, Divider, Dropdown, Menu, Button, Modal } from 'antd';
import Cookies from 'js-cookie';
import logo from '../assets/logo-alt.svg';
import ChangePasswordModal from './ChangePasswordModal';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";

const { Text } = Typography;
const { Header } = Layout;

const NavBar = ({ onNavigateAway }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = sessionStorage.getItem('isSuperUser') === 'true';
    const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const csrfToken = Cookies.get('csrftoken');
    const [viewAsAdmin, setViewAsAdmin] = useState(isAdmin);
    const isDevelopment = import.meta.env.MODE === "development";
    const backendUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;
    

    useEffect(() => {
        const userViewPaths = [
            '/module',
            /^\/interview\/[a-zA-Z0-9-]+$/,
            /^\/interview-history\/[a-zA-Z0-9-]+$/,
            '/interview-complete'
        ];

        const isUserViewPath = userViewPaths.some(path =>
            typeof path === 'string' ? location.pathname === path : path.test(location.pathname)
        );

        setViewAsAdmin(!isUserViewPath);

    }, [location.pathname]);

    const handleNavigate = (navigationCallback) => {
        if (onNavigateAway) {
            onNavigateAway(navigationCallback);
        } else {
            navigationCallback();
        }
    };

    const handleRedirectModule = () => {
        handleNavigate(() => navigate(`/module`));
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
            setModalMessage("Password changed successfully!");
            setIsModalOpen(true);
            setChangePasswordOpen(false);
        } catch (error) {
            console.error("Error changing password:", error);
            setModalMessage("Failed to change password. Please try again.");
            setIsModalOpen(true);
        }
    };

    const toggleViewMode = () => {
        setViewAsAdmin(false);
        navigate('/module', { replace: true });
    };

    const handleModalClose = () => {
        setIsModalOpen(false); 
        setModalMessage(''); 
    };

    const adminItems = [
            {
                key: '1',
                label: (
                    <a onClick={() => handleNavigate(() => navigate("/admin/module-list"))}>
                        Module List
                    </a>
                ),
            },
            {
                key: '2',
                label: (
                    <a onClick={() => handleNavigate(() => navigate("/admin/user-logs"))}>
                        User Logs
                    </a>
                ),
            },
            isAdmin && {
                key: '3',
                label: (
                    <a onClick={toggleViewMode}>
                        Switch to User
                    </a>
                ),
            },
            {
                key: '4',
                label: (
                    <a onClick={() => handleNavigate(toggleChangePasswordModal)}>
                        Change Password
                    </a>
                ),
            },
            {
                key: '5',
                label: (
                    <a onClick={() => handleNavigate(() => {
                        sessionStorage.removeItem("userId");
                        //Cookies.remove('csrftoken'); // Clear CSRF token
                        navigate("/");
                    })}>
                        Logout
                    </a>
                ),
            },
        ].filter(Boolean);

    const userItems = [
            {
                key: '1',
                label: (
                    <a onClick={() => handleNavigate(() => navigate("/module"))}>
                        Select Module
                    </a>
                ),
            },
            {
                key: '2',
                label: (
                    <a onClick={() => handleNavigate(() => {
                        const userId = sessionStorage.getItem('userId');
                        if (userId) {
                            navigate(`/interview-history/${userId}`);
                        }
                    })}>
                        Interview History
                    </a>
                ),
            },
            isAdmin && {
                key: '3',
                label: (
                    <a onClick={() => handleNavigate(() => navigate("/admin/module-list"))}>
                        Switch to Admin
                    </a>
                ),
            },
            {
                key: '4',
                label: (
                    <a onClick={() => handleNavigate(toggleChangePasswordModal)}>
                        Change Password
                    </a>
                ),
            },
            {
                key: '5',
                label: (
                    <a onClick={() => handleNavigate(() => {
                        sessionStorage.removeItem("userId");
                        //Cookies.remove('csrftoken'); // Clear CSRF token
                        navigate("/");
                    })}>
                        Logout
                    </a>
                ),
            },
        ].filter(Boolean);

        const items = viewAsAdmin ? adminItems : userItems;

    return (
        <Header className="navBar">
            <Space direction='horizontal' size="middle" onClick={handleRedirectModule} style={{ width: 'fit-content', cursor: "pointer" }}>
                <img src={logo} alt="SHN Logo" style={{ width: '64px' }} />
                <Divider type='vertical' style={{ borderColor: '#5C5E84', height: '28px', }}></Divider>
                <Text style={{ color: '#5C5E84', fontSize: '16px', lineHeight: '24px', fontWeight: 600, }}>Virtual Interviews</Text>
            </Space>
            <Dropdown
                menu={{ items }}
                trigger={['click']}
            >
                <Button
                    type="text"
                    icon={<MenuOutlined style={{ fontSize: '20px', color: 'inherit' }} />}
                />
            </Dropdown>

                        {/* Feedback Modal */}
                        <Modal
                title="Change Password"
                visible={isModalOpen}
                onOk={handleModalClose}
                onCancel={handleModalClose}
                footer={[
                    <Button key="ok" type="primary" onClick={handleModalClose}>
                        CLOSE
                    </Button>,
                ]}
            >
                <p>{modalMessage}</p>
            </Modal>

            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setChangePasswordOpen(false)}
                onChangePassword={handleChangePassword}
            />
        </Header>
    );
};

export default NavBar;