import React, { useState, useContext, createContext, useEffect } from 'react';

// Create a language context
export const LanguageContext = createContext();

// Hook to use the language context
export const useLanguage = () => {
    return useContext(LanguageContext);
}

// Language provider component
export const LanguageProvider = ({ children }) => {
    // Use lazy initializer to load from localStorage
    const [language, setLanguage] = useState(() => {
        const storedLanguage = localStorage.getItem('language');
        if (storedLanguage) {
            try {
                return JSON.parse(storedLanguage);
            } catch (error) {
                console.error("Error parsing stored language:", error);
                localStorage.removeItem('language');
            }
        }
        return 'FR'; // Default value
    });

    useEffect(() => {
        localStorage.setItem('language', JSON.stringify(language));
    }, [language]);

    const translate = async (value) => {
        setLanguage(value);
    };

    const value = {
        language,
        setLanguage,
        translate,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};