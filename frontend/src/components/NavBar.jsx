import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MenuOutlined } from '@ant-design/icons';
import { Typography, Layout, Space, Divider, Dropdown, Menu, Button } from 'antd';
import Cookies from 'js-cookie';
import logo from '../assets/logo-alt.svg';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";
import ChangePasswordModal from './ChangePasswordModal';

const { Text } = Typography;
const { Header } = Layout;


const NavBar = ({ onNavigateAway }) => {
    const navigate = useNavigate();
    const isAdmin = sessionStorage.getItem('isSuperUser') === 'true';
    const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);
    const isDevelopment = import.meta.env.MODE === "development";
    const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;
    const backendUrl = baseUrl;
    const csrfToken = Cookies.get('csrftoken');

    const handleNavigate = (navigationCallback) => {
        if (onNavigateAway) {
            onNavigateAway(navigationCallback);
        } else {
            navigationCallback();
        }
    };

    const handleRedirectModule = () => {
        navigate(`/module`);
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

            alert("Password changed successfully!");
            setChangePasswordOpen(false);
        } catch (error) {
            console.error("Error changing password:", error);
            alert("Failed to change password. Please try again.");
        }
    };

    const items = [
        {
            key: '1',
            label: (
                <a onClick={() => handleNavigate(handleRedirectModule)}>
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
        {
            key: '3',
            label: (
                <a onClick={() => handleNavigate(toggleChangePasswordModal)}>
                    Change Password
                </a>
            ),
        },
        isAdmin && {
            key: '4',
            label: (
                <a onClick={() => handleNavigate(() => navigate("/admin/module-list"))}>
                    Switch to Admin
                </a>
            ),
        },
        {
            key: '5',
            label: (
                <a onClick={() => handleNavigate(() => {
                    sessionStorage.removeItem("userId");
                    navigate("/");
                })}>
                    Logout
                </a>
            ),
        },
    ].filter(Boolean);

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

            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={toggleChangePasswordModal}
                onChangePassword={handleChangePassword}
            />
        </Header>
    );
};

export default NavBar;