# Où en est le projet, et jusqu'où il peut aller

Ce document explique, sans jargon, ce que l'application fait aujourd'hui, ce que son
architecture supporte, et ce qu'il faudrait ajouter pour en faire un produit avec des
comptes et un abonnement. Il complète [INTEGRATION.md](INTEGRATION.md), qui décrit comment
brancher des données réelles.

---

## 1. Ce que fait l'application aujourd'hui

- **Une carte de France interactive** (3D ou fond de carte réel) où chaque département
  monte et se colore selon un indicateur : chiffre d'affaires, clients, panier moyen,
  évolution.
- **Une démo avec des chiffres fictifs**, pour montrer l'idée.
- **Un import CSV** : le visiteur glisse son fichier (commandes, clients, interventions,
  adhérents…) et voit *ses* chiffres sur la carte. Le fichier est lu **dans son navigateur**,
  rien n'est envoyé sur un serveur.
- **Un formulaire de contact** qui prépare un e-mail.
- Une présentation, une visite guidée, des cas d'usage, des explications sur les données.

## 2. Comment c'est construit

```
Visiteur ─────▶ Coolify (votre VPS) ─────▶ conteneur Docker ─────▶ application Nuxt
                                                                     │
                                                                     ├─ les pages et la carte
                                                                     ├─ /api/departements  (chiffres de la démo)
                                                                     └─ /api/…/marketplace (vendeurs, acheteurs)

Navigateur du visiteur ◀── import CSV : lecture, calcul, mémorisation locale
```

En clair :

| Élément | Rôle | Ce qu'il faut retenir |
| --- | --- | --- |
| **Nuxt** | Le cadre de l'application : les pages, la carte, et un petit serveur | Une seule technologie pour le front et l'API |
| **Le serveur (Nitro)** | Répond aux deux URL `/api/…` | C'est le **seul endroit** qui parle aux données. Brancher un client = changer ce que ces URL renvoient |
| **Docker + Coolify** | Empaquette et héberge l'application sur votre serveur | Déploiement automatique à chaque `git push` |
| **Le navigateur** | Fait tout le travail lourd : la 3D, la lecture du CSV, les calculs | Le serveur ne se fatigue pas, même avec beaucoup de visiteurs |

Ce qu'il n'y a **pas** aujourd'hui : de base de données, de comptes utilisateurs, de
paiement, de tâches automatiques. L'application est « sans état » : elle ne se souvient de
rien d'un visiteur à l'autre.

## 3. Ce que ça supporte tel quel

| Situation | Ça tient ? | Pourquoi |
| --- | --- | --- |
| Montrer la démo à des prospects, la mettre sur un CV, la partager sur LinkedIn | **Oui** | Un petit VPS suffit pour des milliers de visites par jour |
| Des dizaines de personnes qui testent leur CSV en même temps | **Oui** | Chacun calcule dans son propre navigateur : zéro charge pour vous |
| Un fichier de 100 000 lignes | **Oui** | Jusqu'à ~20 Mo, ça passe dans le navigateur |
| Retrouver sa carte le lendemain sur le même ordinateur | **Oui** | Elle est mémorisée dans le navigateur |
| Retrouver sa carte sur un autre appareil, la partager par lien | **Non** | Il faudrait savoir qui est l'utilisateur et stocker ses données |
| Une carte qui se met à jour toute seule | **Non** | Il faudrait un compte, une base et une tâche qui tourne régulièrement |
| Faire payer un abonnement | **Non** | Comptes, paiement, e-mails, obligations légales |

## 4. Les trois paliers de service

C'est ce que vous vendez, du plus simple au plus intégré. **Le même outil, ce n'est que
la façon d'alimenter les données qui change.**

| Palier | L'utilisateur… | Fraîcheur | État |
| --- | --- | --- | --- |
| **1. Fichier** | glisse un CSV quand il veut | photo à l'instant T | **Disponible aujourd'hui** |
| **2. Lien** | colle l'adresse d'un Google Sheet ou d'un fichier partagé ; la carte le relit toutes les heures | quasi automatique | À construire (nécessite comptes + base) |
| **3. Connecteur** | clique « Connecter Shopify » (ou WooCommerce, HubSpot, sa base) | temps réel | À construire (nécessite le palier 2 + travail par connecteur) |

Le palier 1 est gratuit et sert de porte d'entrée. **Ce sont les paliers 2 et 3 qui
justifient un abonnement** : « votre carte se met à jour toute seule ».

## 5. Ce qu'il faudrait ajouter, marche par marche

### Marche 1 — des comptes et une mémoire (la seule vraiment structurante)

C'est la marche qui débloque tout le reste : sauvegarde, partage, historique, abonnement.

- **Des comptes** : connexion par e-mail (lien magique, sans mot de passe à retenir).
- **Une base de données** : PostgreSQL, que Coolify installe en deux clics à côté de
  l'application.
- **Ce qu'on y range** : pour chaque utilisateur, ses « cartes » — nom, unité, libellés, et
  **les 96 chiffres par département déjà calculés**. On ne stocke **jamais le fichier
  brut** : c'est minuscule, et vous n'hébergez aucune donnée personnelle de *leurs*
  clients. C'est un argument de confiance, pas seulement une économie.
- **Ce qui change dans le code** : la partie « mémoire locale du navigateur » est remplacée
  par des appels à `/api/mes-cartes`. La carte, les panneaux et l'import ne bougent pas —
  c'est pour cela que l'application a été découpée ainsi.
- **Ordre de grandeur** : une à deux semaines de travail.

### Marche 2 — le paiement et la mise à jour automatique

- **Stripe** pour l'abonnement : un bouton « S'abonner », et Stripe prévient l'application
  quand le paiement est fait. Les fonctions premium s'ouvrent (sauvegarde, partage,
  historique, lien Google Sheet).
- **La mise à jour automatique** : une petite tâche qui, toutes les heures, relit les liens
  enregistrés et recalcule les cartes. Pas besoin d'infrastructure supplémentaire à ce stade.
- **Ordre de grandeur** : une semaine.

### Marche 3 — les connecteurs

- Une « application » officielle chez Shopify, WooCommerce ou HubSpot, avec le bouton
  « Autoriser » que vous connaissez.
- Les autorisations sont stockées chiffrées ; une file d'attente gère les synchronisations
  (un conteneur Redis de plus).
- **Ordre de grandeur** : trois à cinq jours **par connecteur**. N'y allez que si la
  marche 2 se vend.

## 6. Ce que ça change côté hébergement

Rien de dramatique. Coolify sait héberger une application + une base de données (+ Redis
plus tard), avec des sauvegardes planifiées. Vous passez d'un conteneur à deux ou trois.

Dès la marche 1, deux choses à mettre en place :

1. **Les variables d'environnement** (adresse du site, clé de session, plus tard clés Stripe)
   — dans Coolify, jamais dans le code.
2. **Les sauvegardes automatiques** de la base.

Et des bonnes pratiques qui ne coûtent rien : mettre Cloudflare devant (cache et protection),
surveiller que le site répond (un service gratuit type UptimeRobot).

## 7. Le conseil

**Ne construisez pas la marche 1 tout de suite.** L'application actuelle permet de tester
gratuitement la seule question qui compte : *est-ce que des gens importent leur fichier et
veulent le retrouver demain ?*

- Montrez la démo et l'import à une dizaine de personnes de votre cible (e-commerçants,
  artisans qui expédient, associations, réseaux).
- Notez ce qu'ils cliquent en premier et ce qu'ils demandent ensuite.
- Le jour où plusieurs disent « je voudrais la garder / la partager / qu'elle se mette à
  jour », la marche 1 se justifie — et elle se pose proprement en une à deux semaines.

## 8. Récapitulatif en une image

```
 Aujourd'hui                 Marche 1                  Marche 2                 Marche 3
 ───────────                 ────────                  ────────                 ────────
 Démo + import CSV    ──▶    Comptes + base     ──▶    Abonnement Stripe  ──▶   Connecteurs
 Rien n'est stocké           Cartes sauvegardées       Lien Google Sheet        Shopify, HubSpot…
 0 € d'infra en plus         + Postgres                Mise à jour auto         + Redis, file d'attente
                             1–2 semaines              ~1 semaine               3–5 jours / connecteur
```
