import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// layouts
import AuthLayout from './layouts/auth';

// pages
import Signin from './pages/auth/Signin';
import Signup from './pages/auth/Signup';
import RequestPasswordReset from './pages/auth/RequestPasswordReset';
import PasswordReset from './pages/auth/PasswordReset';
import SignupSuccess from './pages/auth/SignupSuccess';
import SignupVerifyEmail from './pages/auth/SignupVerifyEmail';
import EmailVerified from './pages/auth/EmailVerified';

export default function AppRouter() {
    return (
        <Router>
            <Routes>
                <Route element={<AuthLayout />}>
                    <Route path='/signin' element={<Signin />} />
                    <Route path='/signup' element={<Signup />} />
                    <Route path='/forgot-password' element={<RequestPasswordReset />} />
                    <Route path='/reset-password/:token' element={<PasswordReset />} />
                    <Route path='/validate-email' element={<SignupSuccess />} />
                    <Route path='/signup-verify-email' element={<SignupVerifyEmail />} />
                    <Route path='/email-verified' element={<EmailVerified />} />
                </Route>
            </Routes>
        </Router>
    );
};
