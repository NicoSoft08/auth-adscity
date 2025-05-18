import Cookies from 'js-cookie';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { collectDeviceInfo } from "../services";


const backendUrl = process.env.REACT_APP_BACKEND_URL;

const createUser = async (address, city, country, email, password, firstName, lastName, phoneNumber, displayName, captchaToken) => {

    try {
        const response = await fetch(`${backendUrl}/api/auth/create-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                address, city, country,
                email, password, firstName,
                lastName, phoneNumber, displayName, captchaToken
            }),  // Si tu envoies le mot de passe, assure-toi que c'est sécurisé
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur :', error);
        throw error;
    };
};

const signinUser = async (email, password, captchaToken) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 🔹 Vérifier que l'email est vérifié
        if (!user.emailVerified) {
            return {
                success: false,
                message: "Votre adresse email n'est pas vérifiée. Veuillez vérifier votre boîte de réception."
            };
        }

        // 🔹 Obtenir le jeton Firebase
        const idToken = await user.getIdToken(true);

        // 🔹 Récupérer les informations de périphérique
        const deviceInfo = await collectDeviceInfo();

        // 🔹 Appeler l'API pour créer la session (cookie HTTP-only)
        const response = await fetch(`${backendUrl}/api/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // 🔐 important pour activer le cookie
            body: JSON.stringify({
                token: idToken,
                userID: user.uid,
                deviceInfo,
                captchaToken,
            }),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Erreur lors de signinUser :", error);
        return {
            success: false,
            message: "Erreur lors de la tentative de connexion."
        };
    }
};


const logoutUser = async () => {
    try {
        const user = auth.currentUser;

        const idToken = await user.getIdToken();

        const response = await fetch(`${backendUrl}/api/auth/logout-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        });

        const result = await response.json();

        Cookies.remove('authToken', {
            path: '/',
            domain: '.adscity.net'
        });

        return { success: true, message: result.message || "Déconnexion réussie." };

    } catch (error) {
        throw error;
    }
};

const sendVerificationCode = async (userID, newEmail) => {
    const response = await fetch(`${backendUrl}/api/auth/send-verification-code`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userID, newEmail }),
    });

    const result = await response.json();
    console.log(result);
    return result;
};

const verifyCodeAndUpdateEmail = async (userID, verificationCode, newEmail) => {
    const response = await fetch(`${backendUrl}/api/auth/verify-code-and-update-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userID, verificationCode, newEmail }),
    });

    const result = await response.json();
    // console.log(result);
    return result;
}

const passwordReset = async (email) => {
    try {
        const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),  // Si tu envoies le mot de passe, assure-toi que c'est sécurisé
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la réinitialisation sur le serveur');
        }

        console.log('Mot de passe réinitialisé sur le serveur');
    } catch (error) {
        console.error('Réinitialisation échouée: ', error);
        throw error;
    }
};

const requestPasswordReset = async (email, captchaToken) => {
    try {
        const response = await fetch(`${backendUrl}/api/auth/request-password-reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, captchaToken }),
        });

        const result = await response.json();
        console.log(result);
        return result;
    } catch (error) {
        console.error('Erreur lors de la réinitialisation du mot de passe :', error);
        throw error;
    }
};

const verifyResetToken = async (token) => {
    try {
        const response = await fetch(`${backendUrl}/api/auth/verify-reset-token/${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Erreur lors de la vérification du token de réinitialisation :', error);
        throw error;
    }
};

const updateUserPassword = async (email, newPassword, token, captchaToken) => {
    try {
        const response = await fetch(`${backendUrl}/api/auth/update-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, newPassword, token, captchaToken }),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Erreur lors de la mise à jour du mot de passe :', error);
        throw error;
    }
};

const checkCode = async (email, code) => {

    try {
        const response = await fetch(`${backendUrl}/api/auth/verify-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, code }),
        });

        if (!response.ok) {
            // Si le statut de la réponse n'est pas "OK", retourne un objet avec un message d'erreur
            const errorData = await response.json();
            return { error: errorData.message || 'Erreur lors de la vérification du code' };
        }


        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur lors de la requête vers le serveur :', error);
        throw error;
    }
};

// Delete a User
const deleteUser = async (userID) => {
    try {
        const response = await fetch(`${backendUrl}/api/auth/delete-user`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userID }),
        });


        const result = await response.json();
        // console.log(data.message); 
        return result;
    } catch (error) {
        console.error('Erreur:', error);
    }
};

const validateDevice = async (deviceID, verificationToken) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('Utilisateur non connecté');
    }

    const idToken = await user.getIdToken();

    const response = await fetch(`${backendUrl}/api/auth/verify-device/${deviceID}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ verificationToken }),
    });

    if (!response.ok) {
        throw new Error(`Erreur de validation : ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
};

const refuseDevice = async (deviceID, verificationToken) => {
    const user = auth.currentUser;
    const idToken = await user.getIdToken();
    // Envoyer une requête POST à ton serveur pour refuser l'appareil
    const response = await fetch(`${backendUrl}/api/auth/decline-device/${deviceID}/${verificationToken}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    const result = await response.json();
    // console.log(result);
    return result;
};


export {
    checkCode,
    createUser,
    deleteUser,
    logoutUser,
    passwordReset,
    refuseDevice,
    sendVerificationCode,
    signinUser,
    requestPasswordReset,
    verifyResetToken,
    validateDevice,
    verifyCodeAndUpdateEmail,
    updateUserPassword
};