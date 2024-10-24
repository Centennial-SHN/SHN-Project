// Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import './UserForm.css';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from '../constants';
import { Input, Button, Typography, Card, Layout, Space, Divider, message } from 'antd';
import logo from '../assets/logo-alt.svg';

const { Title, Text } = Typography;

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const isDevelopment = import.meta.env.MODE === "development";
    const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;

    const backendUrl = baseUrl;

    const [passwordVisible, setPasswordVisible] = React.useState(false);

    const [messageApi, contextHolder] = message.useMessage();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== passwordConfirm) {
            setErrorMessage("Passwords do not match!");
            setPassword('');
            setPasswordConfirm('');
            return;
        }
        setErrorMessage('');


        const response = await fetch(`${backendUrl}/api/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            // alert('Registration successful!');
            messageApi.open({
                type: 'success',
                content: 'Signed up successfully!',
            });
            navigate('/');
        } else {
            const data = await response.json();
            // alert(data.error || 'Registration failed!');
            messageApi.open({
                type: 'error',
                content: 'Failed to sign up. Please check your that all your inputs are valid.',
            });
        }
    };

    return (
        <>
            {contextHolder}

            <Layout className="layoutLogInReg">
                <Layout className="layoutRedirectReg">
                    <Space direction="vertical" size="middle" style={{ marginBottom: '32px', position: 'relative', }}>
                        <div className="highlight"></div>
                        <Title level={1}>Already Have an Account?</Title>
                        <Text className="ant-typography-xl">Log in now to access your account and start training with SHN Virtual Interviews.</Text>
                    </Space>
                    <Button type="default" onClick={() => navigate('/')}>Log In</Button>
                </Layout>
                <Layout className="layoutLoginRegForm">
                    <Space direction='horizontal' size="large" className="logoLoginReg">
                        <img src={logo} alt="SHN Logo" style={{ width: '150px' }} />
                        <Divider type='vertical' style={{ borderColor: '#5C5E84', height: '68px', }}></Divider>
                        <Title level={3} style={{ color: '#5C5E84', width: '150px', }}>Virtual Interviews</Title>
                    </Space>
                    <Card bordered={false}>
                        <form onSubmit={handleRegister}>
                            <Space direction="vertical" size="large">
                                <Space direction="vertical" size="middle">
                                    <Title level={1} style={{ color: '#191e72' }}>Create a New Account</Title>
                                    <Text>Sign up now to start using the virtual patient simulator</Text>
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
                                    <Input.Password
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        required
                                        visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
                                    />
                                    {errorMessage && <p style={{ color: 'red', fontSize: '12px' }}>{errorMessage}</p>}
                                </Space>
                                <Button type="primary" htmlType="submit">Register</Button>
                            </Space>
                        </form>
                    </Card>
                </Layout>
            </Layout>
        </>
    );
};

export default Register;
