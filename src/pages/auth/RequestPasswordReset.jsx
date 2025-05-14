import React, { useState } from 'react';
import { requestPasswordReset } from '../../routes/auth';
import { Spinner, Toast } from '../../customs';
import ReCAPTCHA from 'react-google-recaptcha';
import '../../styles/RequestPasswordReset.scss';

// Replace with your actual reCAPTCHA site key
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

export default function RequestPasswordReset() {
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [captchaValue, setCaptchaValue] = useState(null);

    const handleCaptchaChange = (value) => {
        setCaptchaValue(value);
        if (errors.captcha) {
            setErrors({ ...errors, captcha: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!email) {
            newErrors.email = 'Adresse email requise.';
        }
        if (!captchaValue) {
            newErrors.captcha = "Veuillez confirmer que vous n'êtes pas un robot";
        }
        return newErrors;
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
            const result = await requestPasswordReset(email, captchaValue);
            if (result.success) {
                setToast({
                    show: true,
                    type: 'success',
                    message: 'Un email de réinitialisation a été envoyé à votre adresse email.'
                });
                setEmail(''); // Reset email field
                setCaptchaValue(null); // Reset CAPTCHA
                if (window.grecaptcha) {
                    window.grecaptcha.reset();
                }
            } else {
                setToast({ show: true, type: 'error', message: result.message });
                // Reset captcha if request fails
                if (window.grecaptcha) {
                    window.grecaptcha.reset();
                }
                setCaptchaValue(null);
            }
        } catch (error) {
            console.error('Erreur lors de la demande de réinitialisation :', error);
            setToast({
                show: true,
                type: 'error',
                message: 'Une erreur est survenue lors de la demande de réinitialisation. Veuillez réessayer plus tard.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-password-page">
            <form className="reset-form" onSubmit={handleSubmit}>
                <h2>Réinitialisation du mot de passe</h2>
                <p>
                    Entrez votre adresse email pour recevoir un lien de réinitialisation.
                </p>
                {/* Email Field */}
                <div>
                    <label htmlFor="email">Adresse email</label>
                    <input
                        className={`input-field ${errors.email ? 'error' : ''}`}
                        type="email"
                        name="email"
                        id="email"
                        placeholder="Entrez votre adresse email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {errors.email && <div className="error-text">{errors.email}</div>}
                </div>

                <div className="captcha-container">
                    <ReCAPTCHA
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={handleCaptchaChange}
                    />
                    {errors.captcha && <div className="error-text">{errors.captcha}</div>}
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={loading}>
                    {loading ? <Spinner /> : 'Envoyer le lien de réinitialisation'}
                </button>
            </form>

            {/* Toast Notification */}
            <Toast
                show={toast.show}
                type={toast.type}
                message={toast.message}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    );
};
