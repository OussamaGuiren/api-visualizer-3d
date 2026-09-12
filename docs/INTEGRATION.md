# Brancher la carte sur des données réelles

Ce document explique, de façon concrète, comment cette carte passe de la démo (données fictives)
à un projet client (données réelles). Il sert aussi de base de discussion avec un client.

## 1. Le principe en une phrase

**La carte ne sait rien des données : elle appelle deux URL et affiche ce qu'elles renvoient.**
Brancher un client, c'est faire en sorte que ces deux URL renvoient *ses* chiffres, dans le même
format. L'interface (3D, carte, panneaux, export) ne change pas.

```
┌────────────────────┐    GET /api/departements                 ┌────────────────────┐
│  Navigateur        │ ───────────────────────────────────────▶ │  Serveur Nuxt      │
│  (carte 3D / 2D,   │                                          │  (server/api/…)    │
│   panneaux, CSV)   │ ◀─────────────────────────────────────── │                    │
│                    │    JSON : { "75": { ca, clients, … } }   │   ┌──────────────┐ │
│                    │                                          │   │ Aujourd'hui : │ │
│                    │    GET /api/departements/75/marketplace  │   │ fichier JSON  │ │
│                    │ ───────────────────────────────────────▶ │   │ + générateur  │ │
│                    │ ◀─────────────────────────────────────── │   ├──────────────┤ │
│                    │    JSON : { vendeurs, acheteurs, … }     │   │ Demain :      │ │
└────────────────────┘                                          │   │ SQL / CRM /   │ │
                                                                │   │ ERP / Excel   │ │
                                                                └───┴──────────────┴─┘
```

Les deux handlers à modifier :

| URL | Fichier | Ce qu'il renvoie |
| --- | --- | --- |
| `GET /api/departements` | `server/api/departements.get.ts` | Un objet indexé par code département |
| `GET /api/departements/:code/marketplace` | `server/api/departements/[code]/marketplace.get.ts` | Vendeurs, acheteurs, produits d'un département |

## 2. Le contrat (format attendu)

### `GET /api/departements`

```json
{
  "75": {
    "nom": "Paris",
    "region": "Île-de-France",
    "ville": "Paris",
    "lat": 48.857,
    "lon": 2.352,
    "clients": 250,
    "ca": 5100,
    "evolution": 2.1,
    "objectif": 3470
  },
  "2A": { "...": "..." }
}
```

| Champ | Type | Rôle |
| --- | --- | --- |
| `nom`, `region` | texte | Affichage |
| `ville`, `lat`, `lon` | texte, nombres | Étiquette et position sur les cartes (préfecture par défaut) |
| `clients` | entier | Indicateur « Clients » |
| `ca` | nombre (k€) | Indicateur « CA », pilote la hauteur/couleur par défaut |
| `evolution` | nombre (%) | Indicateur « Évolution » (palette divergente) |
| `objectif` | nombre (k€) | Calcul du taux d'atteinte |

Les types sont dans `app/types/departements.ts` (`DeptRaw`). **Renommer un indicateur** (ex. « CA »
→ « Colis livrés ») se fait dans `app/utils/metrics.ts` ; **en ajouter un** = un champ de plus dans
`DeptRaw` et une entrée dans `METRICS`.

### `GET /api/departements/:code/marketplace`

```json
{
  "code": "75",
  "vendeurs":  [{ "id": "…", "nom": "…", "ville": "…", "categorie": "…", "note": 4.6, "produits": 32, "ventes": 120.5, "depuis": 2019 }],
  "acheteurs": [{ "id": "…", "nom": "…", "ville": "…", "type": "Entreprise", "commandes": 18, "montant": 12.4 }],
  "produits":  [{ "id": "…", "nom": "…", "categorie": "…", "vendeur": "…", "prix": 49, "ventes": 310 }]
}
```

## 3. D'où viennent les chiffres chez un client

La question à poser au client : **« Où est stockée l'information, et comment est-elle rattachée à
un lieu ? »** Trois réponses typiques :

### a. Une base de données (cas le plus courant)

Le client a une base SQL (PostgreSQL, MySQL, SQL Server…) derrière son site ou son ERP.
On écrit une requête d'agrégation dans le handler :

```ts
// server/api/departements.get.ts
export default defineEventHandler(async () => {
  const rows = await db.query(`
    SELECT d.code, d.nom, d.region, d.ville, d.lat, d.lon,
           COUNT(DISTINCT c.id)      AS clients,
           SUM(f.montant_ht) / 1000  AS ca,
           SUM(o.montant) / 1000     AS objectif
    FROM   departements d
    LEFT JOIN clients   c ON c.code_dept = d.code
    LEFT JOIN factures  f ON f.client_id = c.id AND f.date >= NOW() - INTERVAL '12 months'
    LEFT JOIN objectifs o ON o.code_dept = d.code AND o.annee = EXTRACT(YEAR FROM NOW())
    GROUP BY d.code`)
  return Object.fromEntries(rows.map((r) => [r.code, r]))
})
```

Le rattachement géographique se fait avec ce que le client a déjà : un **code postal** donne le
département (2 premiers caractères, cas particuliers Corse `20xxx` → `2A`/`2B`), une **adresse**
se géocode gratuitement via la [Base Adresse Nationale](https://adresse.data.gouv.fr/api-doc/adresse),
un **SIRET** donne la commune via l'API Sirene.

### b. Un CRM ou un outil SaaS (HubSpot, Salesforce, Shopify, Pipedrive…)

Ces outils exposent une API. Le handler appelle l'API avec une clé stockée côté serveur
(`runtimeConfig`), regroupe par département et renvoie le même JSON. Comme les quotas d'API sont
limités, on met le résultat en cache :

```ts
export default defineCachedEventHandler(
  async () => {
    const deals = await $fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      headers: { Authorization: `Bearer ${useRuntimeConfig().hubspotToken}` },
    })
    return aggregateByDepartement(deals)
  },
  { maxAge: 60 * 60 }, // recalculé au plus une fois par heure
)
```

### c. Un fichier Excel / CSV (première version, ou petite structure)

On dépose le fichier sur le serveur (ou sur un Google Sheet publié en CSV) et le handler le lit
et l'agrège. C'est souvent suffisant pour une V1 et permet de valider l'usage avant d'investir
dans une connexion à la base.

## 4. Fraîcheur, sécurité, historique

- **Fraîcheur** : `defineCachedEventHandler` avec `maxAge` (nuit, heure) ou lecture directe pour du
  temps réel. Le front n'a pas à changer.
- **Sécurité** : la carte est une application Nuxt classique ; on ajoute une authentification
  (session, SSO d'entreprise) et un filtrage par périmètre dans le handler — un responsable
  régional ne reçoit que ses départements.
- **Historique / comparaison N-1** : ajouter un paramètre `?periode=2025` aux URL et un champ
  `evolution` calculé côté serveur.

## 5. Changer de géographie

Le fond 3D lit un GeoJSON (`public/data/france-departements.geojson`, propriétés `code` et `nom`).
Pour passer aux **régions**, **communes**, **pays** ou à des **zones sur mesure**, on remplace ce
fichier par le découpage voulu (Admin Express de l'IGN, Natural Earth, ou les polygones du client)
et on le simplifie avec `npm run data:geojson`. Les codes du GeoJSON doivent correspondre aux clés
de l'API.

## 6. Ce que ça représente comme travail

| Étape | Livrable | Ordre de grandeur |
| --- | --- | --- |
| Cadrage | Liste des indicateurs, sources, utilisateurs, périmètres | 2 à 5 jours |
| Connexion aux données | Les deux handlers branchés + cache + tests | 3 à 10 jours selon la source |
| Adaptation de l'interface | Libellés, couleurs, indicateurs supplémentaires, logo | 2 à 5 jours |
| Sécurité & déploiement | Authentification, hébergement (Docker fourni), suivi | 2 à 5 jours |
