# 📘 auth.adscity.net – Centre d'authentification AdsCity

*auth.adscity.net* est le service officiel d'authentiication pour l'écosystème d’AdsCity.  
Ce sous-domaine gère l’inscription, la connexion, la vérification des appareils, la gestion des tokens, la sécurité des sessions, et les cookies inter-domaines.

---

## 🔍 Objectif

- Authentification sécurisée via JWT
- Gestion centralisée des sessions pour tous les sous-domaines (admin, dashboard, help, account, etc.)
- Prise en charge des cookies `SameSite=None` avec domaine `.adscity.net`
- Détection d'appareils inconnus (sécurité)
- Préparation pour l'authentification multi-facteurs (2FA)

---
