# Atlas Commercial — carte 3D des performances par département

Tableau de bord 3D interactif qui rend la lecture d'un territoire immédiate : chaque département
est extrudé et coloré selon l'indicateur choisi (chiffre d'affaires, clients, panier moyen,
évolution), et une fiche croise objectif, dynamique et poids régional pour proposer une priorité
d'action.

> Démo portfolio. Les chiffres sont fictifs ; le découpage géographique est réel (96 départements
> métropolitains, Corse incluse).

## Ce que la démo montre

| Côté métier | Côté technique |
| --- | --- |
| Lecture instantanée d'un territoire : hauteur + couleur = indicateur | Nuxt 4, TypeScript strict, composants et composables typés |
| Bascule entre 4 indicateurs, carte ré-extrudée en transition animée | Three.js : GeoJSON projeté en Mercator, extrusion par département, ombres, tone mapping |
| Fiche département : objectif, atteinte, évolution, rang, poids régional, recommandation | GSAP pour les transitions de hauteur/couleur et les déplacements de caméra |
| Vue nationale : KPIs consolidés, top 5, répartition régionale | Raycast à la demande (pas à chaque frame), nettoyage mémoire à l'unmount |
| Export CSV compatible Excel | GeoJSON simplifié hors ligne : 3,3 Mo → 0,7 Mo |

## Tester avec ses propres données

Bouton **Tester mes données** : le visiteur glisse un CSV (export Shopify, WooCommerce, Excel, CRM…).
Le fichier est lu **dans le navigateur** — rien n'est envoyé — les colonnes sont détectées
(code postal / département / nom, montant, client, date), un aperçu affiche le taux de rattachement,
puis la carte bascule sur ces chiffres. Un fichier d'exemple (900 commandes sur 24 mois) est fourni.
L'import est mémorisé en `localStorage` ; « Revenir à la démo » le retire.

Au premier lancement, une présentation puis une **visite guidée** en 5 étapes expliquent l'interface.
Les actions (import, export, copie d'adresse, retour à la démo) donnent un retour par notification.

## Brancher des données réelles

La carte ne lit que deux URL, servies par le serveur Nuxt du projet :

- `GET /api/departements` — indicateurs de tous les départements (`server/api/departements.get.ts`)
- `GET /api/departements/:code/marketplace` — vendeurs, acheteurs, produits d'un département
  (`server/api/departements/[code]/marketplace.get.ts`)

Brancher un client = réécrire ce que ces handlers renvoient (SQL, CRM, Excel…) sans toucher à
l'interface. Le contrat, les exemples de requêtes et les cas SQL / CRM / fichier sont détaillés
dans [docs/INTEGRATION.md](docs/INTEGRATION.md). Pour une vue d'ensemble sans jargon (ce que l'architecture supporte, les trois paliers, les marches suivantes) : [docs/ARCHITECTURE-ET-EVOLUTION.md](docs/ARCHITECTURE-ET-EVOLUTION.md).

## Documentation

- [docs/USAGES.md](docs/USAGES.md) — à quoi sert l'outil au-delà du chiffre d'affaires (aussi en ligne : page `/usages`).
- [docs/OFFRE-ET-DEROULEMENT.md](docs/OFFRE-ET-DEROULEMENT.md) — comment proposer le service : contact, cadrage, maquette, intégration, suivi, prix, objections.
- [docs/ARCHITECTURE-ET-EVOLUTION.md](docs/ARCHITECTURE-ET-EVOLUTION.md) — ce que l'architecture supporte et les marches suivantes.
- [docs/INTEGRATION.md](docs/INTEGRATION.md) — brancher des données réelles (contrat API, SQL, CRM, fichier).

## Deux cartes

- **3D** : départements extrudés (Three.js), noms de préfectures projetés au sommet des blocs.
- **Carte** : fond OpenStreetMap (routes, villes, relief) via Leaflet, mêmes couleurs,
  mêmes interactions.

## Personnaliser

- **Contact & encarts** : nom, e-mail et cadence des encarts promotionnels sont dans
  [`app/app.config.ts`](app/app.config.ts). Ces valeurs s'affichent telles quelles dans l'interface.
- **Cas d'usage** : la liste des scénarios métier est dans `app/components/UseCasesModal.vue`.
- **Sources de données** : le pipeline « projet réel » est décrit dans `app/components/DataSourcesModal.vue`.
- **Couleurs** : tokens CSS dans `app/assets/css/main.css`, palette 3D et ambiance de scène dans
  `app/three/palette.ts`.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # build de production dans .output/
npm run preview    # prévisualisation du build
npm run typecheck  # vérification TypeScript (vue-tsc)
```

## Architecture

```
app/
├── app.vue                     # shell : en-tête + <NuxtPage>
├── pages/index.vue             # composition : carte + HUD + panneau latéral
├── components/
│   ├── FranceMap.vue           # monte le moteur 3D, tooltip, pont Vue ⇄ Three
│   ├── MetricSwitch.vue        # sélecteur d'indicateur
│   ├── MapLegend.vue           # légende de la rampe de couleurs
│   ├── NationalPanel.vue       # KPIs France, top 5, régions
│   ├── DeptPanel.vue           # fiche département + recommandation
│   ├── MapView2D.vue           # fond de carte réel (Leaflet + OpenStreetMap)
│   ├── MarketplacePanel.vue    # vendeurs / acheteurs / produits d'un département
│   ├── ImportModal.vue         # import CSV dans le navigateur (3 étapes)
│   ├── GuidedTour.vue          # visite guidée
│   ├── IntroModal.vue, UseCasesModal.vue, DataSourcesModal.vue, ContactModal.vue
│   └── KpiTile.vue, ToastHost.vue, PromoCard.vue, AppModal.vue
├── composables/
│   ├── useDepartements.ts      # agrégats, rangs, normalisation pour les cartes
│   ├── useDataset.ts           # jeu de données courant : démo ou import du visiteur
│   ├── useMetrics.ts           # métriques disponibles, libellés et unités dynamiques
│   └── useOverlay.ts, useToast.ts
├── three/
│   ├── FranceMap.ts            # classe Three.js autonome (scène, caméra, interactions)
│   ├── projection.ts           # GeoJSON → THREE.Shape (Mercator, trous, multipolygones)
│   └── palette.ts              # rampes de couleurs séquentielle / divergente
├── utils/                      # métriques, formatage fr-FR, export CSV, import CSV (csv.ts), exemple
├── types/departements.ts
└── assets/data/departements-info.json   # indicateurs fictifs (importés au build)
public/data/france-departements.geojson  # géométrie simplifiée, chargée côté client
data/france-departements.source.geojson  # géométrie d'origine (non servie)
public/exemples/*.csv                    # fichiers de test pour l'import
server/api/…                             # les deux points d'entrée API (voir docs/INTEGRATION.md)
scripts/simplify-geojson.mjs             # Douglas-Peucker + arrondi des coordonnées
scripts/generate-examples.mjs            # régénère public/exemples/
```

**Séparation des responsabilités.** `three/FranceMap.ts` ne connaît ni Vue ni les données
métier : il reçoit des valeurs normalisées (`t` pour la couleur, `h` pour la hauteur) et émet
`hover` / `select`. Le composable `useDepartements` porte toute la logique métier (rangs, régions,
normalisation) et reste testable sans WebGL.

**Normalisation.** La couleur suit le rang (répartition uniforme de la palette) ; la hauteur suit la
valeur en racine carrée, pour que Paris n'écrase pas visuellement le reste du territoire.

## Données

- `scripts/simplify-geojson.mjs [tolérance]` régénère `public/data/france-departements.geojson`
  depuis la source (défaut : 0,0025°, soit ~180 000 → ~40 000 points).
- Les indicateurs par département sont dans `app/assets/data/departements-info.json`
  (`nom`, `region`, `clients`, `ca` en k€, `evolution` en %, `objectif` en k€).

## Déploiement

Image Docker multi-étapes (`Dockerfile`) ; le workflow GitHub Actions construit le projet puis
déclenche un hook Coolify sur `main` (secret `COOLIFY_DEPLOY_HOOK_URL`).
