// Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import './UserForm.css';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from '../constants';
import { Input, Button, Typography, Card } from 'antd';

const { Title, Text } = Typography;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const isDevelopment = import.meta.env.MODE === "development";
    const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;

    const backendUrl = baseUrl;

    const handleLogin = async (e) => {
        e.preventDefault();
        const response = await fetch(`${backendUrl}/api/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log(data)
            alert('Login successful! User: ' + data.email);
            sessionStorage.setItem('userId', data.userid);
            sessionStorage.setItem('isSuperUser', data.is_superuser);

            if (data.is_superuser) {
                navigate('/admin/module-list');
            } else {
                navigate('/module');
            }
        } else {
            const data = await response.json();
            alert(data.error || 'Login failed!');
        }
    };

    return (
        <div className="forms">
            <Card bordered={false}>
                <form onSubmit={handleLogin}>
                    <Title level={2}>Login</Title>
                    <div className='container'>
                        <Text>Email</Text>
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className='container'>
                        <Text>Password</Text>
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit">Login</Button>
                    <div>
                        <Text>Don't have an account? <a onClick={() => navigate('/register')}>Register here</a></Text>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Login;
