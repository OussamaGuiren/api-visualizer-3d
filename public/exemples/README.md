# Fichiers d’exemple pour l’import

Tous fictifs, générés par `scripts/generate-examples.mjs`. Glissez-les dans « Tester mes données ».

| Fichier | Lignes | Ce qu’il illustre |
| --- | --- | --- |
| `boutique-complet.csv` | 600 | Export type Shopify/WooCommerce : date, client, code postal, montant → tous les indicateurs, évolution incluse. |
| `boutique-partiel.csv` | 250 | Fichier imparfait : dates au format 14/03/2025, zéros initiaux perdus, « 75 011 », montants avec €, codes postaux vides ou DOM-TOM → l’aperçu compte les lignes ignorées. |
| `minimal-code-postal.csv` | 300 | La seule colonne obligatoire. Pas de montant : la carte compte les lignes (« Enregistrements »). |
| `minimal-departement.csv` | 200 | Codes département (01…95, 2A, 2B) et montant, séparés par des virgules. |
| `artisan-interventions.csv` | 180 | Plombier / électricien : nom du département entre guillemets, pas de client → renommez l’indicateur « CA HT » et le compteur « Interventions ». |
| `association-adherents.csv` | 220 | Liste d’adhérents séparée par tabulations : identifiant + code postal → nombre d’adhérents par département. |
| `commercial-par-departement.csv` | 96 | Déjà agrégé (une ligne par département) : la carte lit directement le CA annuel ; les colonnes non mappées sont ignorées. |
