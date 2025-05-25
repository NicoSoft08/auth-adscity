import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { fetchMe } from '../routes/user';
import { auth } from '../firebaseConfig';
import { Loading } from '../customs/index';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { logoutUser } from '../routes/auth';


// Création du contexte d'authentification
export const AuthContext = createContext();

// Utilisation du contexte pour l'accéder facilement dans les composants
export const useAuth = () => {
    return useContext(AuthContext);
};

// Fournisseur de contexte d'authentification
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);

            try {
                if (user) {
                    // 🔐 Obtenir le token et le stocker en cookie cross-domain
                    const idToken = await user.getIdToken(true);

                    Cookies.set('authToken', idToken, {
                        expires: 7,
                        secure: true,
                        sameSite: 'None',
                        domain: '.adscity.net',
                        path: '/',
                    });

                    setCurrentUser(user);
                } else {
                    // 🔁 Peut-être que l'user est déjà loggé via cookie uniquement
                    setCurrentUser(null);
                }

                // 🔎 Récupérer l'utilisateur via l’API privée
                const response = await fetchMe();

                if (response?.success && response.data) {
                    setUserData(response.data);
                    setUserRole(response.data.role);
                } else {
                    setUserData(null);
                    setUserRole(null);
                }

            } catch (err) {
                console.error("Erreur AuthContext:", err);
                setCurrentUser(null);
                setUserData(null);
                setUserRole(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);


    // Function to handle logout
    const logout = async () => {
        try {
            const user = auth.currentUser;

            // 1. Supprimer le cookie
            Cookies.remove('authToken', {
                path: '/',
                domain: '.adscity.net',
            });

            // 2. Déconnexion côté serveur (optionnel)
            if (user) {
                await logoutUser(user.uid); // Si tu veux notifier le serveur
            }

            // 3. Déconnexion Firebase
            await signOut(auth);

            setCurrentUser(null);
            setUserData(null);
            setUserRole(null);

        } catch (error) {
            console.error("Erreur logout:", error);
        }
    };

    if (loading) {
        return <Loading />
    }


    // Provide values and functions in the context
    const value = {
        currentUser,
        userData,
        loading,
        userRole,
        logout,
        setUserRole, // Include this if you need to update role elsewhere
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};