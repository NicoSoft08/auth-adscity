import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { fetchMe, setUserOnlineStatus } from '../routes/user';
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
                    const idToken = await user.getIdToken(user, true);
                    const response = await fetchMe(idToken);

                    if (response?.data) {
                        setCurrentUser(user);
                        setUserData(response.data);
                        setUserRole(response.data.role);
                        Cookies.set('authToken', idToken, {
                            expires: 7,
                            sameSite: 'None',
                            secure: true,
                            domain: '.adscity.net',
                        });
                    }
                } else {
                    // Essayer de récupérer via cookie (HTTP-only)
                    const response = await fetchMe(); // sans token, juste cookie

                    if (response?.data) {
                        setUserData(response.data);
                        setUserRole(response.data.role);
                        setCurrentUser(null); // pas de Firebase ici
                    }
                }
            } catch (error) {
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

            // 1. Update online status
            if (user?.uid) {
                try {
                    const idToken = await user.getIdToken(true);
                    await setUserOnlineStatus(user.uid, false, idToken);
                    Cookies.remove('authToken', {
                        path: '/',
                        domain: '.adscity.net'
                    });
                } catch (statusError) {
                    console.warn("Failed to update online status:", statusError);
                    // Continue with logout even if this fails
                }
            }

            // 2. Server-side logout
            if (user) {
                try {
                    await logoutUser(user.uid);
                } catch (serverError) {
                    console.warn("Server logout failed:", serverError);
                    // Continue with local logout even if server logout fails
                }
            }

            // 3. Firebase signout
            await signOut(auth);

            // 4. Clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // 5. Return success for UI handling
            return { success: true, message: "Déconnexion réussie." };
        } catch (error) {
            console.error("Error during logout:", error);

            // Force signout in case of error
            try {
                await signOut(auth);
            } catch (signOutError) {
                console.error("Forced signout failed:", signOutError);
            }

            return {
                success: false,
                message: "Erreur lors de la déconnexion. Veuillez réessayer."
            };
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