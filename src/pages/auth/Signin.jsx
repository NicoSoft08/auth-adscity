import React, { useContext, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { LanguageContext } from '../../contexts/LanguageContext';
import { signinUser } from '../../routes/auth';
import { Loading, Spinner, Toast } from '../../customs';
import ReCAPTCHA from 'react-google-recaptcha';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import '../../styles/Signin.scss';

const homeURL = process.env.REACT_APP_HOME_URL;

export default function Signin() {
    const { email } = useParams();
    const location = useLocation();
    const { language } = useContext(LanguageContext);
    const [errors, setErrors] = useState({ email: '', password: '', agree: false, captcha: '' });
    const [toast, setToast] = useState({ show: false, type: '', message: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: email || '', password: '', agree: false });
    const [captchaValue, setCaptchaValue] = useState(null);
    // Récupérer l'URL de redirection depuis location.state ou depuis les query params
    const redirectUrl =
        (location.state && location.state.redirectUrl) ||
        new URLSearchParams(location.search).get('redirect')

    // Replace with your actual reCAPTCHA site key
    const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const validateForm = () => {
        const formErrors = {}
        if (!formData.agree) {
            formErrors.agree = language === 'FR'
                ? "Vous devez accepter les termes et conditions"
                : "You must agree to the terms and conditions";
        } else {
            if (!formData.email) {
                formErrors.email = language === 'FR'
                    ? "Email réquis"
                    : "Email required";
            }
            if (!formData.password) {
                formErrors.password = language === 'FR'
                    ? "Mot de Passe réquis"
                    : "Password required";
            }
        }

        if (!captchaValue) {
            formErrors.captcha = language === 'FR'
                ? "Veuillez confirmer que vous n'êtes pas un robot"
                : "Please confirm that you are not a robot";
        }

        return formErrors;
    };

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleCaptchaChange = (value) => {
        setCaptchaValue(value);
        // Clear captcha error if it exists
        if (errors.captcha) {
            setErrors({
                ...errors,
                captcha: ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({}); // Réinitialise les erreurs

        // 🔹 Validation des champs avant d'envoyer la requête
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            setLoading(false);
            return;
        }

        try {
            const { email, password } = formData;

            // 🔹 Tentative de connexion
            const result = await signinUser(email, password, captchaValue);

            if (!result.success) {
                setToast({
                    show: true,
                    type: 'error',
                    message: result.message || "Une erreur est survenue. Veuillez réessayer.",
                });
                // Reset captcha if login fails
                if (window.grecaptcha) {
                    window.grecaptcha.reset();
                }
                setCaptchaValue(null);
                setLoading(false);
                return;
            }

            setToast({
                show: true,
                type: 'success',
                message: result.message || "Connexion réussie.",
            });

            if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {
                    window.location.href = `${homeURL}`;
                }
        } catch (error) {
            console.error("❌ Erreur lors de la connexion :", error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loading />
    }

    return (
        <div className='login-page'>
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>
                    {language === 'FR'
                        ? "Connexion"
                        : "Login"
                    }
                </h2>
                <div>
                    <label htmlFor="email">
                        {language === 'FR' ? "Adresse e-mail" : "Email"}
                    </label>
                    <input
                        className={`input-field ${errors.email ? 'error' : ''}`}
                        type="email"
                        name='email'
                        id="email"
                        placeholder={language === 'FR' ? "Adresse e-mail" : "Email"}
                        value={formData.email}
                        onChange={handleChange}
                    />
                    {errors.email && <div className="error-text">{errors.email}</div>}
                </div>

                <div className='password-toggle'>
                    <label htmlFor="password">
                        {language === 'FR' ? "Mot de passe" : "Password"}
                    </label>
                    <input
                        className={`input-field ${errors.password ? 'error' : ''}`}
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name='password'
                        placeholder={language === 'FR' ? "Mot de passe" : "Password"}
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <span onClick={toggleShowPassword}>
                        <FontAwesomeIcon
                            icon={showPassword ? faEyeSlash : faEye}
                            title={language === 'FR'
                                ? showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"
                                : showPassword ? "Hide password" : "Show password"
                            }
                        />
                    </span>
                    {errors.password && <div className="error-text">{errors.password}</div>}
                </div>
                <Link to={`/forgot-password`} className="passwrod-forgot">
                    <span>
                        {language === 'FR' ? "Mot de passe oublié ?" : "Forgot password ?"}
                    </span>
                </Link>
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        name="agree"
                        checked={formData.agree}
                        onChange={handleChange}
                    />
                    {language === 'FR'
                        ? "En continuant, vous acceptez les Conditions d'utilisation"
                        : "By continuing, you agree to the Terms of Use"
                    }
                </label>
                {errors.agree && (<div className='error-text'>{errors.agree}</div>)}

                {/* reCAPTCHA component */}
                <div className="captcha-container">
                    <ReCAPTCHA
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={handleCaptchaChange}
                    />
                </div>
                {errors.captcha && <div className="error-text">{errors.captcha}</div>}

                <button
                    type="submit"
                    disabled={loading}
                >
                    {language === 'FR'
                        ? loading ? <Spinner /> : "Se connecter"
                        : loading ? <Spinner /> : 'Login'
                    }
                </button>
                <p>{language === 'FR' ? "Aucun compte utilisateur ?" : "No user account ?"} <Link to={'/signup'}>
                    {language === 'FR' ? "S'inscrire" : "Signup"}
                </Link></p>

                <div className="terms-container">
                    <p>
                        <Link to={`${homeURL}/legal/privacy-policy`} target="_blank">{language === 'FR' ? "Règles de confidentialité" : "Privacy Policy"}</Link>{" - "}
                        <Link to={`${homeURL}/legal/terms`} target="_blank"> {language === 'FR' ? "Conditions d'utilisation" : "Terms of use"}</Link>
                        {/* <Link to="/data-processing" target="_blank">Politique de traitement des données</Link>. */}
                    </p>
                </div>
            </form>
            <Toast message={toast.message} type={toast.type} show={toast.show} onClose={() => setToast({ ...toast, show: false })} />
        </div>
    );
};
