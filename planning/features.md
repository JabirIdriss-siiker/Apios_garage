# Fonctionnalités Apios Garage

Apios Garage est une solution SaaS multi-tenant permettant aux garages automobiles de gérer leur activité de bout en bout.

## 🚀 Fonctionnalités Actuelles (MVP)

### 🔐 Authentification & Rôles
- [ ] **Connexion Sécurisée** : Authentification via JWT.
- [ ] **Gestion des Rôles** : 4 rôles distincts (SUPERADMIN, TENANT_ADMIN, RECEPTION, MECHANIC).
- [ ] **Navigation Contextuelle** : Menus et accès adaptés selon le rôle de l'utilisateur.
- [ ] **Isolation Multi-tenant** : Séparation stricte des données par garage (tenant).
- [ ] **Récupération de Mot de Passe** : Processus de réinitialisation sécurisé par email (Oubli de mot de passe).
- [ ] **Paramètres Profil** : Gestion du compte utilisateur (Modification infos personnelles, changement mot de passe, avatar).

### 👥 Gestion Clients
- [ ] **Fiches Clients** : Création, lecture, mise à jour et suppression (CRUD) des informations clients (nom, contact, adresse).
- [ ] **Recherche Avancée** : Filtrage et recherche rapide de clients.
- [ ] **Historique** : Vue complète des véhicules et interventions passées par client.

### 🚙 Gestion Véhicules
- [ ] **Parc Automobile** : Gestion complète des véhicules (immatriculation, VIN, marque, modèle, kilométrage).
- [ ] **Association** : Lien direct entre véhicule et client propriétaire.
- [ ] **Suivi** : Historique détaillé des réparations et entretiens.

### 🔧 Gestion Interventions
- [ ] **Workflow d'Atelier** : Suivi des statuts (En attente → En cours → Terminé).
- [ ] **Planification** : Assignation des tâches aux mécaniciens.
- [ ] **Suivi Matériel** : Gestion des pièces consommées par intervention.
- [ ] **Documentation** : Ajout de notes techniques et photos.
- [ ] **Rentabilité** : Comparatif coût estimé vs coût réel.

### 📅 Planning & Rendez-vous
- [ ] **Agenda Atelier** : Calendrier hebdomadaire interactif.
- [ ] **Réservation en Ligne** : Pages de réservation publiques dédiées par garage (sous-domaine/URL propre).
- [ ] **Gestion des Ressources** : Vue par mécanicien ou globale.
- [ ] **Suivi RDV** : Statuts de rendez-vous (Planifié, Confirmé, Terminé, Annulé).
- [ ] **Horaires** : Configuration des heures d'ouverture et congés.

### 🚀 Onboarding & Démarrage (Tenant Admin Uniquement)
- [ ] **Assistant de Configuration** : Wizard étape par étape réservé à l'administrateur pour l'initialisation du garage.
- [ ] **Configuration Initiale** : Définition rapide des horaires d'ouverture et des taux de TVA.
- [ ] **Import de Données** : Outil d'importation pour les clients et le catalogue pièces (CSV).
- [ ] **Tour Interactif** : Guide de bienvenue pour présenter les fonctionnalités clés.

### ⚙️ Paramètres du Garage (Tenant Admin Uniquement)
- [ ] **Identité du Garage** : Gestion complète des informations (Nom, Adresse, Logo, Contact).
- [ ] **Abonnement** : Gestion du plan (Basic/Pro), facturation et méthode de paiement.
- [ ] **Configuration** : Paramètres régionaux, devise et préférences globales.

### 📦 Gestion Stock
- [ ] **Catalogue Pièces** : Base de données pièces (Ref, SKU, Prix achat/vente, Fournisseur).
- [ ] **Inventaire** : Suivi des quantités en temps réel.
- [ ] **Alertes** : Notifications de stock bas.
- [ ] **Mouvement de Stock** : Décrémentation automatique lors de la validation d'une intervention.

### 💰 Facturation
- [ ] **Documents Commerciaux** : Génération de devis et factures PDF.
- [ ] **Cycle de Vie** : Suivi des statuts (Brouillon, Envoyé, Payé, En retard).
- [ ] **Fiscalité** : Calcul automatique de la TVA.
- [ ] **Liaison** : Facturation directe depuis une intervention ou un bon de réparation.

### 👨‍💼 SuperAdmin (Plateforme)
- [ ] **Dashboard Global** : Vue d'ensemble de l'activité de la plateforme.
- [ ] **Gestion des Tenants** : Administration des garages inscrits.
- [ ] **Abonnements** : Gestion des plans (Basic, Pro, Business).
- [ ] **Contrôle d'Accès** : Activation ou suspension des comptes garages.

---


### futures features

### 🛍️ Marketplace & Catalogue Partagé
- [ ] **Catalogue Centralisé** : Base de données de pièces partagée optionnelle pour faciliter la saisie.
- [ ] **Marketplace Inter-Garages** : Possibilité (future) d'échanger ou vendre des pièces entre tenants.

### 🎨 Personnalisation Avancée (White Label)
- [ ] **Domaines Personnalisés** : Support des noms de domaine propres (ex: `rdv.mongarage.com`).
- [ ] **Branding Complet** : Personnalisation poussée des couleurs, logos sur l'interface et les emails.
- [ ] **Modèles de Documents** : Éditeur de templates pour les devis et factures.

### 💳 Paiement & Facturation Avancée
- [ ] **Paiement en Ligne** : Intégration Stripe pour le paiement des acomptes lors de la réservation.
- [ ] **Relances Automatiques** : Scénarios d'emails/SMS pour les factures impayées.
- [ ] **Gestion Multi-Devises/Taxes** : Support avancé pour l'internationalisation.

### 📱 Communication Client
- [ ] **Campagnes SMS/Email** : Ooutils marketing pour rappels d'entretien ou promotions.
- [ ] **Portail Client** : Espace dédié pour que le client final consulte ses factures et son historique.

### 🛡️ Sécurité & Ops
- [ ] **Audit Logs** : Journaux d'activité détaillés accessibles aux admins de chaque garage.
- [ ] **Export RGPD** : Outils self-service pour l'export et la suppression des données personnelles.
- [ ] **Migration Tools** : Outils pour migrer un tenant vers une base de données dédiée (pour les offres Enterprise).
### 📡 Intégrations & API
- [ ] **API Publique** : API REST pour l'intégration avec des ERP tiers ou des outils de comptabilité externes.
- [ ] **Webhooks** : Système de notifications par webhook pour les événements clés (nouveau RDV, facture payée).
- [ ] **Connecteurs Fournisseurs** : Intégration EDI pour la commande automatique de pièces chez les fournisseurs partenaires.
