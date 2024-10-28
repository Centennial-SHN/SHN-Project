import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MenuOutlined } from '@ant-design/icons';
import { Typography, Layout, Space, Divider, Dropdown, Menu, Button } from 'antd';
import logo from '../assets/logo-alt.svg';

const { Text } = Typography;
const { Header } = Layout;


const NavBar = ({onNavigateAway}) => {
    const navigate = useNavigate();
    const isAdmin = sessionStorage.getItem('isSuperUser') === 'true';

    const handleNavigate = (navigationCallback) => {
        if (onNavigateAway) {
            onNavigateAway(navigationCallback); 
        } else {
            navigationCallback();
        }
    };

    const items = [
        {
            key: '1',
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
            //need to update reset password link
            key: '2',
            label: (
                <a onClick={() => handleNavigate(() => navigate("/"))}>
                    Reset Password
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
            <Space direction='horizontal' size="middle" style={{ width: 'fit-content' }}>
                <img src={logo} alt="SHN Logo" style={{ width: '64px' }} />
                <Divider type='vertical' style={{ borderColor: '#5C5E84', height: '28px', }}></Divider>
                <Text style={{ color: '#5C5E84', fontSize: '16px', lineHeight: '24px', fontWeight:600, }}>Virtual Interviews</Text>
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
        </Header>
    );
};

export default NavBar;