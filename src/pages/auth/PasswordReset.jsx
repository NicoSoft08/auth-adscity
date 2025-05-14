import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { updateUserPassword, verifyResetToken } from '../../routes/auth';
import { Spinner, Toast } from '../../customs';
import ReCAPTCHA from 'react-google-recaptcha';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import '../../styles/PasswordReset.scss';

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

export default function PasswordReset() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '', // Email will be fetched using the token
        password: '',
        confirmPassword: '',
        agree: false
    });
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [tokenVerified, setTokenVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [captchaValue, setCaptchaValue] = useState(null);

    

    const toggleShowPassword = () => setShowPassword(!showPassword);
    const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    const handleCaptchaChange = (value) => {
        setCaptchaValue(value);
        if (errors.captcha) {
            setErrors({ ...errors, captcha: '' });
        }
    };

    // Verify token and get associated email on component mount
    useEffect(() => {
        const checkToken = async () => {
            setLoading(true);
            try {
                const result = await verifyResetToken(token);
                if (result.success) {
                    setFormData(prev => ({ ...prev, email: result.email }));
                    setTokenVerified(true);
                } else {
                    setToast({
                        show: true,
                        type: 'error',
                        message: 'Ce lien de réinitialisation est invalide ou a expiré.'
                    });
                    // Redirect after showing the message
                    setTimeout(() => {
                        navigate('/forgot-password');
                    }, 3000);
                }
            } catch (error) {
                setToast({
                    show: true,
                    type: 'error',
                    message: 'Une erreur est survenue lors de la vérification du token.'
                });
                setTimeout(() => {
                    navigate('/forgot-password');
                }, 3000);
            } finally {
                setLoading(false);
            }
        };

        checkToken();
    }, [token, navigate]);

    const validateForm = () => {
        const errors = {};
        const { password, confirmPassword, agree } = formData;

        if (!agree) {
            errors.agree = 'Vous devez accepter les termes et conditions.';
        }

        if (!password) {
            errors.password = 'Mot de passe requis.';
        } else if (password.length < 8) { // Stronger password requirement
            errors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
        } else if (!/[A-Z]/.test(password)) {
            errors.password = 'Le mot de passe doit contenir au moins une majuscule.';
        } else if (!/[0-9]/.test(password)) {
            errors.password = 'Le mot de passe doit contenir au moins un chiffre.';
        }

        if (!confirmPassword) {
            errors.confirmPassword = 'Confirmation du mot de passe requise.';
        } else if (password !== confirmPassword) {
            errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
        }

        return errors;
    };

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setLoading(false);
            return;
        }

        try {
            const result = await updateUserPassword(formData.email, formData.password, token, captchaValue);

            if (result.success) {
                setToast({
                    show: true,
                    type: 'success',
                    message: 'Votre mot de passe a été réinitialisé avec succès.'
                });
                setTimeout(() => {
                    navigate('/signin');
                }, 2000);
            } else {
                setToast({
                    show: true,
                    type: 'error',
                    message: result.message || 'Une erreur est survenue.'
                });
            }
        } catch (error) {
            setToast({
                show: true,
                type: 'error',
                message: 'Une erreur est survenue lors de la réinitialisation du mot de passe.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Show loading or error state if token is not verified
    if (loading && !tokenVerified) {
        return (
            <div className="reset-password-page">
                <div className="reset-form">
                    <h2>Vérification du lien</h2>
                    <div className="loading-container">
                        <Spinner />
                        <p>Vérification du lien de réinitialisation...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-page">
            <form className="reset-form" onSubmit={handleSubmit}>
                <h2>Réinitialisation du mot de passe</h2>

                {/* Password Field */}
                <div className="password-toggle">
                    <label htmlFor="password">Nouveau mot de passe</label>
                    <input
                        className={`input-field ${errors.password ? 'error' : ''}`}
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Entrez un mot de passe"
                    />
                    <span onClick={toggleShowPassword}>
                        <FontAwesomeIcon
                            icon={showPassword ? faEyeSlash : faEye}
                            title={showPassword ? 'Cacher' : 'Afficher'}
                        />
                    </span>
                    {errors.password && <div className="error-text">{errors.password}</div>}
                </div>

                {/* Confirm Password Field */}
                <div className="password-toggle">
                    <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                    <input
                        className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirmez le mot de passe"
                    />
                    <span onClick={toggleShowConfirmPassword}>
                        <FontAwesomeIcon
                            icon={showConfirmPassword ? faEyeSlash : faEye}
                            title={showConfirmPassword ? 'Cacher' : 'Afficher'}
                        />
                    </span>
                    {errors.confirmPassword && <div className="error-text">{errors.confirmPassword}</div>}
                </div>

                {/* Agree Checkbox */}
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        name="agree"
                        checked={formData.agree}
                        onChange={handleChange}
                    />
                    J'accepte les termes et conditions.
                </label>
                {errors.agree && <div className="error-text">{errors.agree}</div>}

                <div className="captcha-container">
                    <ReCAPTCHA
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={handleCaptchaChange}
                    />
                    {errors.captcha && <div className="error-text">{errors.captcha}</div>}
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={loading}>
                    {loading ? <Spinner /> : 'Réinitialiser'}
                </button>
            </form>

            <Toast show={toast.show} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
        </div>
    );
};
