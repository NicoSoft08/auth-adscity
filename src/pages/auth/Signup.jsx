import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import zxcvbn from 'zxcvbn';
import PhoneInput from "react-phone-input-2";
import cities from '../../json/ru.json';
import { LanguageContext } from '../../contexts/LanguageContext';
import { countries } from '../../config';
import { createUser } from '../../routes/auth';
import { Spinner, Toast } from '../../customs';
import ReCAPTCHA from 'react-google-recaptcha';
import { Eye, EyeOff, Search } from 'lucide-react';
import "react-phone-input-2/lib/style.css";
import '../../styles/Signup.scss';

const homeURL = process.env.REACT_APP_HOME_URL;

const steps = (language) => (language === 'FR'
    ? ['Informations', 'Contact', 'Location', 'Sécurité']
    : ['Information', 'Contact', 'Location', 'Security']
);
const strengthColors = ['red', 'orange', 'yellow', 'green'];

export default function Signup() {
    const navigate = useNavigate();
    const { language } = useContext(LanguageContext);
    const [step, setStep] = useState(0);
    const [toast, setToast] = useState({ show: false, type: '', message: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCountry] = useState(countries[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [captchaValue, setCaptchaValue] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        country: selectedCountry.name,
        city: '',
        address: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        agree: false,
    });
    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        country: '',
        city: '',
        address: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        agree: false,
    });

    // Replace with your actual reCAPTCHA site key
    const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

    const validate = (currentStep) => {
        const newErrors = {};
        const { firstName, lastName, email, phoneNumber, password, confirmPassword, city, address } = formData;

        if (currentStep === 0) {
            if (!firstName.trim()) newErrors.firstName = 'Prénom requis';
            if (!lastName.trim()) newErrors.lastName = 'Nom requis';
        }
        if (currentStep === 1) {
            if (!email.trim()) newErrors.email = 'Email requis';
            else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email invalide';
            if (!phoneNumber.trim()) newErrors.phoneNumber = 'Numéro requis';
            else if (!phoneNumber.trim() || phoneNumber.length < 10) newErrors.phoneNumber = 'Numéro invalide';
        }
        if (currentStep === 2) {
            if (!city.trim()) newErrors.city = 'Ville requise';
            if (!address.trim()) newErrors.address = 'Adresse requise';
        }
        if (currentStep === 3) {
            if (!password.trim() || password.length < 6) newErrors.password = 'Mot de passe trop court';
            if (password !== confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }

        if (!captchaValue) {
            newErrors.captcha = "Veuillez confirmer que vous n'êtes pas un robot";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePhoneChange = (value) => {
        setFormData(prev => ({
            ...prev,
            phoneNumber: value
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
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

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (value.length >= 2) {
            const filtered = cities.filter(city =>
                city.city.toLowerCase().startsWith(value.toLowerCase())
            );
            setFilteredCities(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const passwordStrength = zxcvbn(formData.password).score;

    const nextStep = () => {
        if (validate(step)) setStep(prev => prev + 1);
    };
    const prevStep = () => setStep(step - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.agree === true) {
            setToast({ show: true, type: 'error', message: 'Veuillez accepter les conditions d\'utilisation' });
            return;
        }

        // Check CAPTCHA completion
        if (!captchaValue) {
            setToast({ show: true, type: 'error', message: 'Veuillez confirmer que vous n\'êtes pas un robot' });
            return;
        }
        setIsLoading(true);

        // S'assurer que le numéro est bien formaté en E.164
        const phoneNumber = formData.phoneNumber.startsWith('+') ? formData.phoneNumber : `+${formData.phoneNumber}`;

        try {
            const displayName = `${formData.firstName} ${formData.lastName}`;
            const { address, city, country, email, password, firstName, lastName } = formData;
            const result = await createUser(address, city, country, email, password, firstName, lastName, phoneNumber, displayName, captchaValue);

            if (result.success) {
                setTimeout(() => {
                    navigate(`/validate-email`, { state: { userData: formData } });
                }, 5000);
                // Reset captcha if login fails
                if (window.grecaptcha) {
                    window.grecaptcha.reset();
                }
                setCaptchaValue(null);
                setIsLoading(false);
            } else {
                setToast({ show: true, type: 'error', message: result.message });
            }
        } catch (error) {
            console.error('Erreur lors de l\'inscription :', error);
            setToast({ show: true, type: 'error', message: 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCitySelect = (city) => {
        setFormData(prev => ({
            ...prev,
            city: city.city // Stocke uniquement le nom de la ville
        }));
        setSearchTerm(city.city); // Mettre à jour l'input avec la ville sélectionnée
        setShowSuggestions(false);
    };

    return (
        <div className="signup-page">
            <div className="signup-form">
                {/* Progress Bar */}
                <div className="progress-bar">
                    {steps(language).map((label, index) => (
                        <div key={index} className="step">
                            <div className={`bulb ${index <= step ? 'active' : ''}`}>{index + 1}</div>
                            <div className={`label ${index <= step ? 'active' : ''}`}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Form Steps */}
                <div className="form-group">
                    {step === 0 && (
                        <div className='form-group-item'>
                            <input
                                type='text'
                                name='firstName'
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder='Prénom'
                                className={`input-field ${errors.firstName ? 'error' : ''}`}
                            />
                            {errors.firstName && <span className='error-message'>{errors.firstName}</span>}

                            <input
                                type='text'
                                name='lastName'
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder='Nom'
                                className={`input-field ${errors.lastName ? 'error' : ''}`}
                            />
                            {errors.lastName && <span className='error-message'>{errors.lastName}</span>}
                        </div>
                    )}

                    {step === 1 && (
                        <div className='form-group-item'>
                            <input
                                type='email'
                                name='email'
                                value={formData.email}
                                onChange={handleChange}
                                placeholder='Email'
                                className={`input-field ${errors.email ? 'error' : ''}`}
                            />
                            {errors.email && <span className='error-message'>{errors.email}</span>}

                            <PhoneInput
                                country={"ru"} // Pays par défaut (Russie ici)
                                onlyCountries={['ru']}
                                value={formData.phoneNumber}
                                onChange={handlePhoneChange}
                                inputStyle={{ width: "100%" }}
                            />
                            {errors.phoneNumber && <span className='error-message'>{errors.phoneNumber}</span>}
                        </div>
                    )}

                    {step === 2 && (
                        <div className='form-group-item'>
                            <input
                                type='text'
                                name='country'
                                value={formData.country}
                                onChange={handleChange}
                                placeholder='Pays'
                                className={`input-field ${errors.country ? 'error' : ''}`}
                            />
                            {errors.country && <span className='error-message'>{errors.country}</span>}

                            <div className="search-field">
                                <input
                                    type="text"
                                    name="searchTerm"
                                    placeholder="Rechercher une ville"
                                    value={searchTerm}
                                    className={`input-field ${errors.searchTerm ? "error" : ""}`}
                                    onChange={handleSearch}
                                />
                                <span className="search-icon">
                                    <Search size={20} />
                                </span>

                                {showSuggestions && (
                                    <ul className="suggestions-list">
                                        {filteredCities.map((city, index) => (
                                            <li key={index} onClick={() => handleCitySelect(city)}>
                                                {city.city}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {errors.city && <span className='error-message'>{errors.city}</span>}

                            <input
                                type='text'
                                name='address'
                                value={formData.address}
                                onChange={handleChange}
                                placeholder='Adresse'
                                className={`input-field ${errors.address ? 'error' : ''}`}
                            />
                            {errors.address && <span className='error-message'>{errors.address}</span>}
                        </div>
                    )}

                    {step === 3 && (
                        <div className='form-group-item'>
                            <div className="password-field">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Mot de passe"
                                    className={`input-field ${errors.password ? 'error' : ''}`}
                                />
                                <span className='eye-icon' onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </span>
                            </div>

                            <div className="password-strength">
                                <div className="strength-bar" style={{ backgroundColor: strengthColors[passwordStrength] }}>
                                    {['Faible', 'Moyen', 'Bon', 'Fort'][passwordStrength]}
                                </div>
                            </div>
                            {errors.password && <span className='error-message'>{errors.password}</span>}

                            <div className="confirm-password-field">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirmez le mot de passe"
                                    className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
                                />
                                <span className='eye-icon' onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </span>
                            </div>
                            {errors.confirmPassword && <span className='error-message'>{errors.confirmPassword}</span>}
                        </div>
                    )}
                </div>

                <input type='checkbox' id='agree' name='agree' value={formData.agree} onChange={handleChange} />
                <label htmlFor="agree" className="agree-label">En continuant, vous acceptez les Conditions d'utilisation</label>
                {errors.agree && <span className='error-message'>{errors.agree}</span>}

                {/* reCAPTCHA component */}
                <div className="captcha-container">
                    <ReCAPTCHA
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={handleCaptchaChange}
                    />
                </div>
                {errors.captcha && <div className="error-text">{errors.captcha}</div>}

                {/* Navigation Buttons */}
                <div className="form-navigation">
                    {step > 0 && (
                        <button className="back-button" onClick={prevStep}>
                            Retour
                        </button>
                    )}

                    {step < 3 && (
                        <button className="next-button" onClick={nextStep}>
                            Suivant
                        </button>
                    )}

                    {step === 3 && (
                        <button className="submit" onClick={handleSubmit}>
                            {isLoading ? <Spinner /> : "Suivant"}
                        </button>
                    )}
                </div>


                <p>Avez-vous déjà un compte utilisateur ? <Link to={'/signin'}>Se connecter</Link></p>

                <div className="terms-container">
                    <p>
                        <Link to={`${homeURL}/legal/privacy-policy`} target="_blank">Confidentialité</Link>{" - "}
                        <Link to={`${homeURL}/legal/terms`} target="_blank">Conditions d'utilisation</Link>
                        {/* <Link to="/data-processing" target="_blank">Politique de traitement des données</Link>. */}
                    </p>
                </div>
            </div>
            <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

        </div>
    );
};
