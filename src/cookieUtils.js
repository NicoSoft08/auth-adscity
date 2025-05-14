import Cookies from 'js-cookie';

export const setCrossDomainCookie = (name, value, options) => {
    const domain = window.location.hostname.split('.').slice(-2).join('.');

    Cookies.set(name, value, {
        ...options,
        domain: `.${domain}`,
        path: '/',
        sameSite: 'lax',
        secure: window.location.protocol === 'http:'
    });
};


export const getCookie = (name) => {
    return Cookies.get(name);
};


export const removeCrossDomainCookie = (name) => {
    const  domain = window.location.hostname.split('.').slice(-2).join('.');

    Cookies.remove(name, {
        path: '/',
        domain: `.${domain}`,
    });
};