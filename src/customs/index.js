import React, { useContext, useEffect, useState } from "react";
import { Dots } from "react-activity";
import { letterWhiteBgBlue, textBlueWithoutBg } from "../config";
import { translations } from "../langs/translations";
import { LanguageContext } from "../contexts/LanguageContext";
import "react-activity/dist/library.css";
import '../styles/customs.scss';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faExclamationCircle, faInfoCircle, faTimes } from "@fortawesome/free-solid-svg-icons";

export const Loading = () => {
    const { language } = useContext(LanguageContext)
    const t = translations[language] || translations.FR;

    return (
        <div className="loading-modal">
            <div className="loading-container">
                <img src={letterWhiteBgBlue} alt="AdsCity" className="loading-logo" />
                <div className="loading-header">
                    <img src={textBlueWithoutBg} alt="AdsCity" className="loading-text" />
                </div>
                <span className="loading-span">
                    {t.loading}
                </span>
                <div className="loading-spinner"></div>
            </div>
        </div>
    );
};

export const Spinner = () => {
    return <Dots />
};


export const Toast = ({ type = 'info', message, show, onClose, duration = 3000 }) => {
    const [progress, setProgress] = useState(100);
    useEffect(() => {
        if (show) {
            let interval = null;

            const startTime = Date.now();
            interval = setInterval(() => {
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(duration - elapsedTime, 0);
                setProgress((remainingTime / duration) * 100);

                if (remainingTime <= 0) {
                    clearInterval(interval);
                    onClose();
                }
            }, 50);

            return () => clearInterval(interval);
        }
    }, [show, onClose, duration]);

    const renderIcon = () => {
        switch (type) {
            case 'success':
                return faCheckCircle;
            case 'error':
                return faExclamationCircle;
            case 'info':
                return faInfoCircle;
            default:
                return faInfoCircle;
        }
    };

    return (
        show && (
            <div className={`toast ${type}`}>
                <FontAwesomeIcon className="toast-icon" icon={renderIcon()} />
                <div className="toast-message">
                    <p>{message}</p>
                </div>
                <span className="close" onClick={onClose}><FontAwesomeIcon icon={faTimes} /></span>
                <div className="toast-progress-bar">
                    <div className="progress" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        )
    );
}