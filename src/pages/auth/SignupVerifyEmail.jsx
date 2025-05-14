import { faCheckCircle, faSpinner, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { applyActionCode } from 'firebase/auth';
import React, { useContext, useEffect, useState } from 'react';
import { auth } from '../../firebaseConfig';
import { LanguageContext } from '../../contexts/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../styles/SignupVerifyEmail.scss';

export default function SignupVerifyEmail() {
    const [verificationState, setVerificationState] = useState('verifying'); // 'verifying', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { language } = useContext(LanguageContext);

    useEffect(() => {
        const verifyEmail = async () => {
            // Get the action code from the URL
            const queryParams = new URLSearchParams(location.search);
            const oobCode = queryParams.get('oobCode');
            const continueUrl = queryParams.get('continueUrl');

            if (!oobCode) {
                setVerificationState('error');
                setErrorMessage(language === 'FR'
                    ? 'Code de vérification manquant.'
                    : 'Verification code is missing.');
                return;
            }

            try {
                // Apply the action code to verify the email
                await applyActionCode(auth, oobCode);
                setVerificationState('success');

                // Extract the UID from the continueUrl if present
                let uid = null;
                if (continueUrl) {
                    const continueUrlObj = new URL(continueUrl);
                    uid = new URLSearchParams(continueUrlObj.search).get('uid');
                }

                // Redirect after a short delay
                setTimeout(() => {
                    if (uid) {
                        navigate(`/email-verified?uid=${uid}`);
                    } else {
                        navigate('/signin');
                    }
                }, 3000);

            } catch (error) {
                console.error('Error verifying email:', error);
                setVerificationState('error');

                // Handle specific error codes
                switch (error.code) {
                    case 'auth/invalid-action-code':
                        setErrorMessage(language === 'FR'
                            ? 'Le lien de vérification est invalide ou a expiré.'
                            : 'The verification link is invalid or has expired.');
                        break;
                    case 'auth/user-disabled':
                        setErrorMessage(language === 'FR'
                            ? 'Ce compte utilisateur a été désactivé.'
                            : 'This user account has been disabled.');
                        break;
                    case 'auth/user-not-found':
                        setErrorMessage(language === 'FR'
                            ? 'Aucun utilisateur correspondant à ce code de vérification.'
                            : 'No user corresponding to this verification code.');
                        break;
                    default:
                        setErrorMessage(language === 'FR'
                            ? 'Une erreur s\'est produite lors de la vérification de votre email.'
                            : 'An error occurred while verifying your email.');
                }
            }
        };

        verifyEmail();
    }, [location, navigate, language]);

    return (
        <div className="email-verification-container">
            <div className="verification-card">
                <div className="verification-icon">
                    {verificationState === 'verifying' && (
                        <FontAwesomeIcon icon={faSpinner} spin className="verifying-icon" />
                    )}
                    {verificationState === 'success' && (
                        <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
                    )}
                    {verificationState === 'error' && (
                        <FontAwesomeIcon icon={faTimesCircle} className="error-icon" />
                    )}
                </div>

                <h2>
                    {verificationState === 'verifying' && (language === 'FR'
                        ? 'Vérification de votre email...'
                        : 'Verifying your email...')}
                    {verificationState === 'success' && (language === 'FR'
                        ? 'Email vérifié avec succès!'
                        : 'Email successfully verified!')}
                    {verificationState === 'error' && (language === 'FR'
                        ? 'Échec de la vérification'
                        : 'Verification failed')}
                </h2>

                <p>
                    {verificationState === 'verifying' && (language === 'FR'
                        ? 'Veuillez patienter pendant que nous vérifions votre adresse email...'
                        : 'Please wait while we verify your email address...')}
                    {verificationState === 'success' && (language === 'FR'
                        ? 'Votre adresse email a été vérifiée avec succès. Vous allez être redirigé...'
                        : 'Your email address has been successfully verified. You will be redirected shortly...')}
                    {verificationState === 'error' && errorMessage}
                </p>

                {verificationState === 'error' && (
                    <div className="verification-actions">
                        <button
                            className="retry-btn"
                            onClick={() => navigate('/auth/login')}
                        >
                            {language === 'FR' ? 'Retour à la connexion' : 'Back to login'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
