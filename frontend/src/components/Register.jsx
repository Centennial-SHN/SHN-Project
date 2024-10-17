// Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserForm.css';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const isDevelopment = import.meta.env.MODE === "development";
    const baseUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

    const backendUrl = baseUrl;

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
            alert('Registration successful!');
            navigate('/');
        }else {
                alert(data.error || 'Registration failed!');
        } 
    };

    return (
        <div className="forms">
        <form onSubmit={handleRegister}>
            <h2>Register</h2>
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
            <div className='container'>
                    <span>Confirm Password</span>  {/* New field for password confirmation */}
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        required
                    />
                </div>
                <br/>
                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            <button type="submit">Register</button>
            <br />
            <p>
                Already registered?{' '}
                <span
                    style={{ color: 'blue', cursor: 'pointer' }}
                    onClick={() => navigate('/')}  // Navigate to login page
                >
                    Log in
                </span>
            </p>
        </form>
        </div>
    );
};

export default Register;
