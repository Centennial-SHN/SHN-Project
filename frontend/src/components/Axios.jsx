import  axios  from 'axios';

const baseURL = 'http://localhost:8080/api';
const isDevelopment = process.env.NODE_ENV === 'development';
const baseURL2 = isDevelopment 
    ? import.meta.env.VITE_API_BASE_URL_LOCAL 
    : import.meta.env.VITE_API_BASE_URL_PROD; // No quotes here


const AxiosInstance = axios.create({
    baseURL: baseURL2,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
    },
    xsrfCookieName: 'csrftoken', // This matches Django's default CSRF cookie name
    xsrfHeaderName: 'X-CSRFToken',
});

export default AxiosInstance;