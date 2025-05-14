import React, { useState } from 'react';
import { checkCode } from '../../routes/auth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import ReactCodeInput from 'react-code-input';
import { Toast } from '../../customs';
import '../../styles/SignupSuccess.scss';

const frontendUrl = process.env.REACT_APP_FRONTEND_URL;

export default function SignupSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const userData = location.state?.userData;

    const [toast, setToast] = useState({ show: false, type: '', message: '' });
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);

    const handleChange = (value) => {
        const sanitizedValue = value.replace(/\D/g, '');
        setCode(sanitizedValue);

        if (sanitizedValue.length === 6) {
            setTimeout(() => {
                handleSubmit(sanitizedValue);
            }, 500);
        }
    };

    const handleSubmit = async (code) => {
        try {
            const result = await checkCode(userData?.email, code);

            if (result.error) {
                setError('Erreur lors de la vérification du code.');
                setSuccess('');
            } else {
                setSuccess('Votre code a été vérifié avec succès !');
                setError('');
                setShowModal(true); // Afficher le Modal en cas de succès
            }
        } catch (error) {
            setError('Une erreur est survenue. Veuillez réessayer.');
            setSuccess('');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        navigate(`/signin/${userData?.email}`); // Redirige vers la connexion après succès
    };

    if (!userData) {
        setToast({
            show: true,
            type: 'error',
            message: 'Aucune donnée utilisateur trouvée',
        });
        return <div>Erreur: Aucune donnée utilisateur trouvée</div>;
    }

    const { email, firstName, lastName } = userData;

    return (
        <div className='signup-success-page'>
            <h1>Confirmation du mail, <strong>{firstName} {lastName}</strong> !</h1>
            <p>Un code de vérification a été envoyé à <strong>{email}</strong>. Entrez le code à 6 chiffres.</p>

            <ReactCodeInput
                value={code}
                type='text'
                fields={6}
                className="code-input"
                onChange={handleChange}
            />

            {error && <div className="error">{error}</div>}

            {/* ✅ Modal s'affiche quand le code est validé */}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="success-container">
                            <CheckCircle size={50} className="success-icon" />
                            <h2>Succès</h2>
                            <p>{success} Vous pouvez maintenant vous connecter.</p>
                            <button className="modal-button" onClick={handleCloseModal}>
                                Accéder à Mon Compte
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <h2>Premiers Pas</h2>
            <ul>
                <li><Link to={`${frontendUrl}/start-guide`}>Guide de démarrage rapide</Link></li>
                <li><a href="https://youtube.com/@AdsCity24">Tutoriels vidéo</a></li>
                <li><Link to={`${frontendUrl}/help`}>Centre d'aide</Link></li>
            </ul>

            <h2>Contactez-nous</h2>
            <p>Pour toute question, contactez-nous via notre <Link to={`${frontendUrl}/contact-us`}>page de support</Link> ou par email à <a href="mailto:support@adscity.net">support@adscity.net</a>.</p>

            <div className="links">
                <Link to={`${frontendUrl}`}>Retour à l'Accueil</Link>
            </div>

            <Toast show={toast.show} type={toast.type} message={toast.message} onClose={() => setToast({ ...toast, show: false })} />
        </div>
    );
};
