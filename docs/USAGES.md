# À quoi sert l'application, au-delà du chiffre d'affaires

Le « chiffre d'affaires » de la démo n'est qu'un exemple. L'outil ne connaît que deux choses :
**un territoire** et **un nombre par territoire**. Tout ce qui a un code postal peut se lire
comme ça. Cette page existe aussi dans le site : `/usages`.

## Comment ça marche, en cinq étapes

```
 1. Vos données      2. Rattachement       3. La carte          4. Trois lectures     5. La décision
 ─────────────       ───────────────       ──────────           ────────────────      ──────────────
 Export CSV, Excel,  Code postal,          Hauteur et couleur   Où c'est fort,        Renforcer,
 CRM, boutique en    département ou nom    suivent l'indi-      où c'est vide,        prospecter,
 ligne, base SQL     → une zone            cateur choisi        où ça bouge           réallouer, alerter
```

Au palier « Fichier » (l'import CSV), les cinq étapes se déroulent dans le navigateur du
visiteur : aucune donnée n'est envoyée.

## Une carte, trois questions

C'est ce qu'un tableau ne montre pas :

| Lecture | Ce qu'on voit | Ce qu'on en fait |
| --- | --- | --- |
| **Où c'est fort** | La concentration : les zones qui portent l'activité | Sécuriser, renforcer, dédier un interlocuteur |
| **Où c'est vide** | Les zones blanches : rien, alors qu'il devrait y avoir quelque chose. Invisible dans un tableau, évident sur une carte | Prospecter, communiquer localement, ouvrir un point |
| **Où ça bouge** | L'évolution sur un an : ce qui décolle ou décroche avant que ça se voie dans le total | Aller voir pourquoi, réallouer le budget |

## Le même outil, d'autres métiers

Dans l'import, on renomme l'**indicateur** (le montant) et le **compteur** (les lignes ou les
personnes distinctes). La colonne **date** donne l'évolution sur un an ; la colonne
**identifiant** compte des personnes plutôt que des lignes.

| Qui | Indicateur | Compteur | La question que la carte répond |
| --- | --- | --- | --- |
| Artisan, dépanneur, installateur | Montant HT des interventions | Interventions | « Où je me déplace le plus, et est-ce que ça vaut le coup d'aller si loin ? » |
| Association, club, fédération | Cotisations (ou rien) | Adhérents | « Où sont nos membres, où sommes-nous absents ? » |
| École, organisme de formation | Frais d'inscription | Inscrits | « D'où viennent nos élèves, où communiquer ? » |
| Cabinet médical, réseau de soins | — | Patients, consultations | « Quelle zone couvrons-nous réellement ? » |
| Recruteur, employeur | — | Candidatures | « Où recruter, où nos annonces ne touchent personne ? » |
| Service client, SAV | Coût des retours | Réclamations | « Où ça casse : un transporteur, un secteur ? » |
| Immobilier | Prix de vente, loyer | Biens, mandats | « Où est la tension, où les délais s'allongent ? » |
| Logistique, livraison | Coût par livraison | Colis | « Où livrer coûte cher, où le délai dérape ? » |
| Collectivité, mairie, département | Budget engagé | Dossiers, demandes | « Où va l'argent, où les citoyens sollicitent ? » |
| Événementiel, tourisme | Dépense moyenne | Visiteurs, billets | « D'où viennent nos visiteurs, où faire de la pub ? » |
| Assurance, gestion de sinistres | Montant des sinistres | Dossiers | « Où est le risque ? » |
| Marketing, acquisition | Coût d'acquisition | Leads, conversions | « Où mon budget convertit ? » |
| Marketplace, réseau de partenaires | Ventes par zone | Vendeurs, acheteurs | « Où recruter des vendeurs, où la demande dépasse l'offre ? » |

Des fichiers d'exemple pour plusieurs de ces cas sont dans `public/exemples/` (artisan,
association, force de vente…).

## Changer d'échelle

Le découpage est un fichier de contours qu'on remplace. Le geste reste le même : un code sur
chaque ligne, un contour par zone.

- **Communes d'un département** — un artisan, une communauté de communes, une agence locale.
- **Quartiers d'une ville** — une mairie, un agent immobilier, un réseau de commerces.
- **Régions** — une direction nationale qui veut une lecture synthétique.
- **Pays d'Europe, monde** — un exportateur, une marketplace internationale.

Les contours officiels (communes, départements, régions) sont gratuits (IGN Admin Express sur
data.gouv.fr) ; ceux d'une ville (quartiers, IRIS) le sont aussi (INSEE, open data des villes).

## Les limites, honnêtement

L'outil n'est pas fait pour :

- des données **sans lieu** — une activité 100 % en ligne sans adresse client ;
- l'analyse **à l'intérieur** d'un lieu — le plan d'un magasin, le parcours sur un site web ;
- les **DOM-TOM**, pas encore sur cette carte (un second découpage suffirait).

Il faut que la question commence par « **où** ».

## Et après la démo : trois paliers

| Palier | L'utilisateur… | État |
| --- | --- | --- |
| **1. Fichier** | glisse un CSV quand il veut ; photo à l'instant T, rien n'est envoyé | Disponible |
| **2. Lien** | colle l'adresse d'un Google Sheet ou d'un fichier partagé ; la carte le relit toutes les heures | À construire |
| **3. Connecteur** | branche Shopify, WooCommerce, HubSpot ou sa base ; la carte se met à jour toute seule | À construire |

Voir [ARCHITECTURE-ET-EVOLUTION.md](ARCHITECTURE-ET-EVOLUTION.md) pour ce que chaque palier
demande, et [OFFRE-ET-DEROULEMENT.md](OFFRE-ET-DEROULEMENT.md) pour la façon de proposer le
service.
