import axios from 'axios';
import Cookies from 'js-cookie';


const getCurrentDomain = () => {
    const hostname = window.location.hostname;

    if (hostname.includes('localhost')) {
        return 'http://localhost:3000';
    } else {
        return `https://${hostname}`;
    };
};

const api = axios.create({
    baseURL: getCurrentDomain(),
    withCredentials: true,
});


api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('auth_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshResponse = await axios.post(
                    `${getCurrentDomain()}/api/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                const { token } = refreshResponse.data;

                Cookies.set('auth_token', token, {
                    expires: 7,
                    secure: true,
                    sameSite: 'strict',
                    domain: '.adscity.net',
                    path: '/'
                });

                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                return axios(originalRequest);
            } catch (refreshError) {
                window.location.href = '/signin';

            }
        }

        return Promise.reject(error);
    }
);

export default api;