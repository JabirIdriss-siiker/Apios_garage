# Module de Gestion des Interventions

## Vue d'ensemble

Le module de gestion des interventions permet de suivre l'ensemble du cycle de vie d'une réparation ou maintenance de véhicule, depuis la création jusqu'à la finalisation avec verrouillage des données.

## Fonctionnalités principales

### 1. Liste des interventions
- Affichage de toutes les interventions avec filtrage par statut
- Recherche par client, véhicule, mécanicien ou description
- Pagination pour gérer de grandes listes
- Vue des informations clés: client, véhicule, mécanicien, statut, coûts

### 2. Création d'intervention
- Sélection du client et de son véhicule
- Description détaillée des travaux à effectuer
- Estimation du coût
- Assignation optionnelle d'un mécanicien
- Statut initial (par défaut: "En attente")
- Notes internes privées

### 3. Workflow de statut
Les interventions suivent un workflow strict:
- **En attente (pending)**: Intervention créée, en attente d'assignation ou de démarrage
- **En cours (in_progress)**: Intervention en cours de réalisation, `started_at` est défini
- **Terminée (completed)**: Intervention finalisée, `completed_at` est défini, données verrouillées

### 4. Assignation de mécanicien
- Admin et Réception peuvent assigner ou changer le mécanicien
- Possible à tout moment si l'intervention n'est pas terminée
- Le mécanicien peut mettre à jour l'intervention qui lui est assignée

### 5. Gestion des pièces utilisées
- Ajout de pièces avec nom, quantité et prix unitaire
- Calcul automatique du prix total de chaque pièce
- Calcul automatique du coût total des pièces
- Suppression possible tant que l'intervention n'est pas terminée
- Liste détaillée avec totaux

### 6. Gestion des photos
- Ajout de photos via URL
- Description optionnelle pour chaque photo
- Suppression possible (même après finalisation pour admin/reception)
- Affichage en grille responsive

### 7. Coûts estimé vs réel
- **Coût estimé**: Défini lors de la création
- **Coût réel**: Calculé automatiquement à partir du total des pièces
- Comparaison visuelle des deux coûts
- Le coût réel est mis à jour automatiquement lors de la finalisation

### 8. Verrouillage des interventions terminées
Lorsqu'une intervention est marquée comme "Terminée":
- Les champs critiques ne peuvent plus être modifiés
- Le coût réel est calculé et fixé
- La date de fin est enregistrée
- Seules les photos peuvent encore être supprimées (par admin/reception)
- Un indicateur de verrouillage est affiché

## Permissions par rôle

### TENANT_ADMIN et RECEPTION
- Créer des interventions
- Modifier toutes les interventions (sauf celles terminées)
- Assigner/réassigner des mécaniciens
- Changer le statut des interventions
- Ajouter/supprimer des pièces et photos
- Supprimer des interventions

### MECHANIC
- Voir les interventions
- Modifier les interventions qui lui sont assignées
- Ajouter des pièces et photos sur ses interventions
- Mettre à jour le statut de ses interventions
- Ajouter des notes

### ACCOUNTANT
- Voir les interventions
- Consultation en lecture seule

## Structure de données

### Table `interventions`
- `id`: Identifiant unique
- `tenant_id`: Garage propriétaire
- `client_id`: Client concerné
- `vehicle_id`: Véhicule concerné
- `mechanic_id`: Mécanicien assigné (nullable)
- `description`: Description des travaux
- `status`: Statut (pending, in_progress, completed)
- `estimated_cost`: Coût estimé
- `actual_cost`: Coût réel (calculé)
- `notes`: Notes internes privées
- `started_at`: Date de début (définie au passage en "En cours")
- `completed_at`: Date de fin (définie au passage en "Terminée")
- `created_at`, `updated_at`: Dates de suivi

### Table `intervention_parts`
- `id`: Identifiant unique
- `tenant_id`: Garage propriétaire
- `intervention_id`: Intervention concernée
- `name`: Nom de la pièce
- `quantity`: Quantité
- `unit_price`: Prix unitaire
- `total_price`: Prix total (calculé: quantity × unit_price)
- `created_at`: Date d'ajout

### Table `intervention_photos`
- `id`: Identifiant unique
- `tenant_id`: Garage propriétaire
- `intervention_id`: Intervention concernée
- `photo_url`: URL de la photo
- `description`: Description optionnelle
- `created_at`: Date d'ajout

## Sécurité (RLS)

Toutes les tables utilisent Row Level Security:
- Isolation stricte par `tenant_id`
- Les utilisateurs ne peuvent accéder qu'aux données de leur garage
- Permissions différenciées selon les rôles
- Cascade de suppression sécurisée

## Navigation

Le module est accessible depuis le menu principal du TenantDashboard:
- Lien "Interventions" dans le menu desktop
- Lien "Interventions" dans le menu mobile

## Composants

### InterventionsPage
Page principale listant toutes les interventions avec recherche et filtres

### InterventionModal
Modal de création/modification d'intervention (formulaire basique)

### InterventionDetailsModal
Modal détaillé affichant:
- Informations complètes de l'intervention
- Liste des pièces avec totaux
- Galerie de photos
- Gestion du statut et du mécanicien
- Ajout de pièces et photos
- Comparaison coûts estimé vs réel
- Indicateur de verrouillage si terminée

## Workflow typique

1. Réception crée une intervention pour un client
2. Assignation d'un mécanicien
3. Passage du statut à "En cours"
4. Le mécanicien ajoute les pièces utilisées au fur et à mesure
5. Ajout de photos des réparations
6. Passage du statut à "Terminée" → verrouillage automatique
7. Le coût réel est calculé et fixé
8. L'intervention est archivée et ne peut plus être modifiée
