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
        // Check for stored user data on initial load
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUserRole(parsedUser.role);
            } catch (error) {
                console.error("Error parsing stored user data:", error);
                localStorage.removeItem('user'); // Remove invalid data
            }
        }

        // Listen for auth state changes from Firebase
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);

            try {
                if (user) {
                    setCurrentUser(user);

                    const idToken = await user.getIdToken();

                    // Fetch user data from backend
                    const userDataResponse = await fetchMe(idToken);
                    if (userDataResponse?.data) {
                        setUserData(userDataResponse.data);
                        setUserRole(userDataResponse.data.role);

                        // Update online status
                        await setUserOnlineStatus(user.uid, true, idToken);
                        Cookies.set('authToken', idToken, { expires: 7 }); // Store token for 7 days
                    }
                } else {
                    // If there was a user before and now there isn't, update online status
                    const previousUserID = currentUser?.uid;
                    if (previousUserID) {
                        const idToken = await currentUser.getIdToken(true);
                        await setUserOnlineStatus(previousUserID, false, idToken);
                        Cookies.remove('authToken', {
                            path: '/',
                            domain: '.adscity.net'
                        });
                    }

                    // Clear user state
                    setCurrentUser(null);
                    setUserData(null);
                    setUserRole(null);
                }
            } catch (error) {
                console.error("Error in auth state change handler:", error);
            } finally {
                setLoading(false);
            }
        });

        // Cleanup function
        return () => {
            unsubscribe();
        };
    }, [currentUser]); // No dependencies to avoid re-running this effect

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