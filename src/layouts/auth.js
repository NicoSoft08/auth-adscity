import React, { useContext, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { LanguageContext } from '../contexts/LanguageContext';
import { AuthContext } from '../contexts/AuthContext';
import { Loading } from '../customs';

const homeURL = process.env.REACT_APP_HOME_URL;

// styles
const styles = {
    wrap: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px',
        backgroundColor: '#417abc',
    }, left: {
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
    }, leftTitle: {
        marginLeft: '8px',
        cursor: 'pointer',
    }, right: {
        textDecoration: 'none',
    }, rightTitle: {
        cursor: 'pointer',
        color: '#fff',
    },
};

const AuthLayoutHeader = () => {
    const location = window.location;
    const { currentUser, loading } = useContext(AuthContext);
    const { language } = useContext(LanguageContext);
    const isLogin = location.pathname === '/signin';
    const isSignup = location.pathname === '/signup';
    const isSignupConfirm = location.pathname === '/signup/verify-email';
    const isPasswordReset = location.pathname === '/reset-password';
    const isSignupSuccess = location.pathname === '/signup/success';

    // Récupérer l'URL de redirection depuis location.state ou depuis les query params
    const redirectUrl =
        (location.state && location.state.redirectUrl) ||
        new URLSearchParams(location.search).get('redirect');


    // Check if the user is authenticated
    // Redirect to redirectUrl if authenticated
    useEffect(() => {
        if (currentUser && redirectUrl) {
            window.location.href = redirectUrl;
            return;
        }
    }, [currentUser, redirectUrl]);

    let leftLink = `${homeURL}`;
    let leftText = language === 'FR'
        ? 'Accueil'
        : 'Home';

    if (isSignup || isSignupConfirm || isPasswordReset || isSignupSuccess) {
        leftLink = '/signin';
        leftText = language === 'FR'
            ? 'Connexion'
            : 'Login'; 
    }

    if (loading || !currentUser) return <Loading />

    return (
        <div style={styles.wrap}>
            <a href={leftLink} style={styles.left}>
                <FontAwesomeIcon icon={faChevronLeft} />
                <span style={styles.leftTitle}>{leftText}</span>
            </a>
            {isLogin && (
                <a href="/signup" style={styles.right}>
                    <span style={styles.rightTitle}>
                        {language === 'FR' ? "Inscription" : "Signup"}
                    </span>
                </a>
            )}
        </div>
    );
}

export default function AuthLayout() {
    return (
        <div>

            <AuthLayoutHeader />

            <Outlet />

        </div>
    );
};