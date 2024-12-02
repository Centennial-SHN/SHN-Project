import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from '../constants';
import { Input, Button, Typography, Card, Layout, Space, Divider, message } from 'antd';
import logo from '../assets/logo-alt.svg';

const { Title, Text } = Typography;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const isDevelopment = import.meta.env.MODE === "development";
    const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;
    const csrfToken = Cookies.get('csrftoken');//TEST CSRF TOKEN
    const backendUrl = baseUrl;

    const [passwordVisible, setPasswordVisible] = React.useState(false);

    const [messageApi, contextHolder] = message.useMessage();

    const handleLogin = async (e) => {
        e.preventDefault();
        const response = await fetch(`${backendUrl}/api/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log(data)
            messageApi.open({
                type: 'success',
                content: 'Successfully logged in!',
            });
            sessionStorage.setItem('userId', data.userid);
            sessionStorage.setItem('isSuperUser', data.is_superuser);

            if (data.is_superuser) {
                navigate('/admin/module-list');
            } else {
                navigate('/module');
            }
        } else {
            // const data = await response.json();
            messageApi.open({
                type: 'error',
                content: 'Failed to log in. Please check your login credentials.',
            });
        }
    };

    return (
        <>
            {contextHolder}

            <Layout className="layoutLogInReg">
                <Layout className="layoutRedirectLog">
                    <Space direction="vertical" size="middle" style={{ marginBottom: '32px', position: 'relative', }}>
                        <div className="highlight"></div>
                        <Title level={1}>First Time Here?</Title>
                        <Text className="ant-typography-xl">Don&#39;t have an account yet? Sign up to start training with SHN  Virtual Interviews.</Text>
                    </Space>
                    <Button type="default" onClick={() => navigate('/register')}>Sign Up</Button>
                </Layout>
                <Layout className="layoutLoginRegForm">
                    <Space direction='horizontal' size="large" className="logoLoginReg">
                        <img src={logo} alt="SHN Logo" style={{ width: '150px' }} />
                        <Divider type='vertical' style={{ borderColor: '#5C5E84', height: '68px', }}></Divider>
                        <Title level={3} style={{ color: '#5C5E84', width: '150px', }}>Virtual Interviews</Title>
                    </Space>
                    <Card bordered={false}>
                        <form onSubmit={handleLogin}>
                            <Space direction="vertical" size="large">
                                <Space direction="vertical" size="middle">
                                    <Title level={1} style={{ color: '#191e72' }}>Log in to Your Account</Title>
                                    {/* <Text>Login to start using the virtual patient simulator.</Text> */}
                                </Space>
                                <Space direction="vertical" size="middle">
                                    <Input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <Input.Password
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
                                    />
                                </Space>
                                <Button type="primary" htmlType="submit">Log in</Button>
                            </Space>
                        </form>
                    </Card>
                </Layout>
            </Layout>
        </>
    );
};

export default Login;
