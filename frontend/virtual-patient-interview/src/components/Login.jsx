// Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserForm.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const response = await fetch('http://localhost:8000/api/login/', {
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
            // Redirect or store user data here
            if (data.is_superuser) {
                navigate('/admin/module-list');  // Redirect to the module list page for superusers
            } else {
                navigate('/module');  // Redirect to the module selection page for regular users
            }
        } else {
            const data = await response.json();
            alert(data.error || 'Login failed!');
        }
    };

    return (
        <div className="forms">
        <form onSubmit={handleLogin}>
            <h2>Login</h2>
            <br/>
            <br/>
            <div className='container'>
            <span>Email</span>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            </div>
            <br/>
            <div className='container'>
            <span>Password</span>
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            </div>
            <br/>
            <button type="submit">Login</button>
            <br/>
            <div>
                <p>Don't have an account? <a href="/register" onClick={() => navigate('/register')}>Register here</a></p>
            </div>
        </form>
        </div>
    );
};

export default Login;