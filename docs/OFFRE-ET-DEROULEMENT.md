# Comment proposer le service : cadrage, maquette, intégration

Ce document est pour toi. Il explique comment se déroule une mission autour de la carte, du
premier échange à la livraison, avec ce que tu dis, ce que tu demandes, ce que tu livres et
ce que tu factures. Les prix sont des ordres de grandeur pour un indépendant en France : ajuste
à ton marché et à ton expérience.

---

## 0. La logique d'ensemble

Tu ne vends pas « une carte 3D ». Tu vends **une réponse rapide à la question « où ? »** pour
quelqu'un qui aujourd'hui ouvre un Excel. Et tu la vends **en trois marches de plus en plus
engageantes**, pour que le client ne prenne jamais un gros risque d'un coup :

| Marche | Ce que le client obtient | Durée | Ordre de prix | Pourquoi ça marche |
| --- | --- | --- | --- | --- |
| **1. Cadrage** | Un document d'une page : ses indicateurs, ses sources, ses utilisateurs, un chiffrage | 1 semaine (2 à 3 jours de ton temps) | 500 à 1 500 €, ou offert si la maquette suit | Faible risque, ça révèle le vrai besoin |
| **2. Maquette** | La carte **avec ses vraies données** (un export), hébergée, accès par lien | 1 à 2 semaines | 1 500 à 3 000 € | Il voit son activité dedans : c'est là que ça se décide |
| **3. Intégration** | La carte branchée sur ses outils, sécurisée, à ses couleurs, avec formation | 3 à 6 semaines | 6 000 à 15 000 € selon la source | Le vrai projet, mais désormais sans surprise |
| **4. Suivi** | Hébergement, mises à jour des données, ajout d'indicateurs | mensuel | 200 à 500 €/mois | Ton revenu stable |

Règle d'or : **ne chiffre jamais l'intégration avant la maquette.** Tu ne connais pas encore
ses données ni ses outils. Répondre « commençons par une maquette » est la bonne réponse à
« combien ça coûte ? ».

---

## 1. Le premier contact (30 minutes, gratuit)

**Objectif :** comprendre s'il y a un besoin, pas vendre.

**Tu montres** la démo en 60 secondes : deux clics sur des départements, un changement
d'indicateur, l'export CSV, puis l'import avec le fichier d'exemple. Puis tu poses **la**
question :

> « Si c'étaient vos chiffres, qu'est-ce que vous cliqueriez en premier ? »

Sa réponse, c'est son besoin. Note-la mot pour mot.

**Tu demandes ensuite :**
1. Quelle question il aimerait lire sur la carte (« où sont mes clients », « où je perds du
   temps », « où je ne suis pas »).
2. Où sont ses données aujourd'hui (Excel, boutique en ligne, CRM, logiciel métier, papier).
3. Qui regarderait la carte (lui seul, une équipe, des partenaires, des élus).
4. À quelle fréquence il aurait besoin qu'elle soit à jour (une fois, chaque mois, en continu).

**Tu conclus** par une proposition simple : « Envoyez-moi un export, même imparfait. En une
semaine je vous rends la carte avec vos vrais chiffres et un chiffrage pour la suite. »

**Signal d'arrêt :** s'il n'a pas de données avec un lieu (adresse, code postal, ville), l'outil
ne l'aidera pas. Dis-le. Tu gagnes du temps et de la crédibilité.

---

## 2. Le cadrage (1 semaine)

**Objectif :** transformer l'envie en une liste précise, courte, chiffrée.

### Ce que tu fais

- **Un entretien d'une heure** (visio ou sur place) avec la personne qui décide et, si
  possible, celle qui manipule les données.
- **Tu récupères un export réel** : un CSV/Excel de ses commandes, clients ou interventions.
  Pas besoin qu'il soit propre. C'est ta matière première.
- **Tu l'importes dans la carte** (bouton « Tester mes données ») : tu vois en dix minutes ce
  qui se rattache, ce qui manque, si les dates permettent l'évolution.
- **Tu écris le document de cadrage** (une page, voir modèle ci-dessous).

### Le document de cadrage (modèle)

```
CADRAGE — [Nom du client] — [date]

1. La question à lire sur la carte
   « Où …………………………………………………………… ? »

2. Les indicateurs (3 maximum pour commencer)
   - Indicateur principal : ………… (colonne : ………, unité : ………)
   - Compteur : ………… (colonne : ………)
   - Évolution : oui / non (dates disponibles sur … mois)

3. Les données
   - Source : ………… (Excel / Shopify / CRM … / base)
   - Colonne géographique : code postal / département / adresse
   - Qualité observée à l'import : … % de lignes rattachées, … ignorées
   - Fréquence de mise à jour souhaitée : une fois / mensuelle / continue

4. Les utilisateurs
   - Qui : …………   Combien : …   Où : bureau / terrain / réunion
   - Droits : tout le monde voit tout / par région / par équipe

5. La maille
   - Départements / communes de … / quartiers de … / régions / pays

6. Ce qui est hors périmètre pour l'instant
   - …

7. Proposition
   - Maquette : … € — livrée le …
   - Intégration (estimation, à confirmer après maquette) : entre … et … €
   - Suivi : … €/mois
```

### Ce que tu livres

Le document de cadrage, et une **capture d'écran de la carte avec ses données** (celle de
ton import test). Cette capture vaut plus que tout le reste.

### Ce que tu factures

500 à 1 500 €, ou **offert et déduit** si la maquette est commandée. Offrir le cadrage est un
bon choix quand tu débutes : le coût pour toi est de deux jours, et le client qui a une capture
de sa propre carte en main dit rarement non à la maquette.

---

## 3. La maquette (1 à 2 semaines)

**Objectif :** que le client voie son activité dans l'outil et se dise « je veux la garder ».

### Ce que tu fais

1. **Tu prépares ses données** à partir de son export : nettoyage des codes postaux, choix des
   colonnes, calcul de l'évolution si possible. C'est le palier « Fichier » de l'outil — tu
   n'as pas d'intégration à écrire.
2. **Tu remplaces le jeu de démo** par le sien dans une copie du projet (le fichier
   `app/assets/data/departements-info.json` ou le handler `/api/departements`), tu renommes
   les indicateurs à ses mots (« Interventions », « Adhérents »…), tu mets son logo et sa
   couleur (deux valeurs dans `main.css` et `app.config.ts`).
3. **Tu adaptes les textes** : la présentation, les cas d'usage et les encarts de la démo
   n'ont pas leur place — tu les désactives ou tu les remplaces par son contexte.
4. **Tu héberges** sur ton Coolify, sur une adresse du type `client.ton-domaine.fr`, avec un
   mot de passe simple (protection HTTP) : ce sont ses données.
5. **Tu présentes en 30 minutes**, en visio ou sur place. Tu ne parles pas technique : tu
   cliques sur *ses* départements et tu lis avec lui ce que la carte dit. Note ses réactions,
   ce sont les spécifications de l'intégration.

### Ce que tu livres

- L'accès à la maquette (lien + mot de passe), pour une durée définie (30 jours).
- Un court compte rendu : ce que la carte a montré, ce que le client a demandé en plus, la
  proposition d'intégration chiffrée.

### Ce que tu factures

1 500 à 3 000 €, **50 % à la commande, 50 % à la présentation**. Précise dans le devis :
une source de données, jusqu'à trois indicateurs, une maille, un aller-retour de corrections.
Tout le reste est « à chiffrer ».

### Pièges à éviter

- Ne pas promettre la mise à jour automatique à ce stade : la maquette est une photo.
- Ne pas passer trois jours à nettoyer un fichier catastrophique : si plus de 30 % des lignes ne
  se rattachent pas, retourne vers le client avec la liste des problèmes — c'est son travail
  (ou une prestation à part).

---

## 4. L'intégration (3 à 6 semaines)

**Objectif :** la carte vit toute seule, chez lui, avec ses outils, ses droits, ses couleurs.

### Ce que tu fais

| Semaine | Travail | Livrable visible |
| --- | --- | --- |
| 1 | Connexion aux données : tu écris ce que renvoient les deux URL de l'outil (`/api/departements`, `/api/…/marketplace`) à partir de sa base, de son CRM ou de son fichier partagé — voir [INTEGRATION.md](INTEGRATION.md) | La carte affiche ses données **d'hier** sans intervention manuelle |
| 2 | Rafraîchissement automatique (nuit, heure ou temps réel), gestion des erreurs, historique N-1 | Un tableau de bord de contrôle : dernière mise à jour, lignes traitées |
| 3 | Sécurité : connexion, droits par périmètre (un responsable régional ne voit que sa région) | Comptes créés, test avec deux profils |
| 4 | Habillage : logo, couleurs, textes, indicateurs supplémentaires, maille demandée | Recette avec le client |
| 5–6 | Mise en production sur son hébergement ou le tien, formation (1 h), documentation d'exploitation | Livraison + procès-verbal de recette |

### Ce que tu demandes au client

- Un **accès** aux données (export automatisé, accès lecture à la base, clé API du CRM ou de
  la boutique) — à demander dès la signature, c'est ce qui bloque le plus souvent.
- Un **interlocuteur** qui répond dans la semaine.
- Ses éléments graphiques (logo, couleurs).
- Une décision sur l'hébergement : chez toi (plus simple, suivi mensuel) ou chez lui (il gère).

### Ce que tu livres

- L'application en production.
- Le code source (dépôt Git) si c'est prévu au contrat — sinon tu restes propriétaire et il a
  une licence d'usage ; à écrire noir sur blanc.
- Une documentation d'exploitation d'une à deux pages : comment ça se met à jour, qui appeler.
- Une formation d'une heure enregistrée.

### Ce que tu factures

6 000 à 15 000 € selon la source (un fichier partagé est simple, un ERP ancien ne l'est pas),
**30 % à la commande, 40 % à la recette, 30 % à la livraison.** Toute demande hors devis est un
avenant chiffré — c'est normal et attendu.

---

## 5. Le suivi (mensuel)

200 à 500 €/mois pour : hébergement, sauvegardes, surveillance, mise à jour des données,
petites évolutions (un indicateur, un texte), une réponse sous 48 h. Engagement de 12 mois,
résiliable avec un mois de préavis. C'est ce qui rend ton activité prévisible.

---

## 6. Les documents dont tu as besoin

Tu peux tout faire avec quatre documents :

1. **Un devis** (obligatoire, avec ton SIRET) — pour chaque marche.
2. **Des conditions générales de prestation** d'une page : propriété du code, confidentialité
   des données, responsabilité limitée au montant de la mission, délais de paiement (30 jours),
   pénalités de retard.
3. **Un accord de confidentialité** simple si le client le demande (il te confie ses données).
4. **Un procès-verbal de recette** pour l'intégration : la liste de ce qui a été livré, signée.

Des modèles gratuits existent (sites de fédérations d'indépendants, portail des auto-entrepreneurs).
Fais-en relire un une fois par un professionnel ; ensuite tu les réutilises.

---

## 7. Ce que tu réponds aux objections

| Il dit | Tu réponds |
| --- | --- |
| « On a déjà Power BI / un CRM avec une carte. » | « Très bien pour vos analystes. Ceci est pour ceux qui n'ouvrent pas Power BI : direction, terrain, partenaires. Et ça lit les mêmes données. » |
| « Nos données sont sensibles. » | « Elles restent chez vous. L'outil les lit via un accès que vous contrôlez, avec des droits par périmètre. Et la maquette peut se faire sur un extrait anonymisé. » |
| « C'est joli, mais utile ? » | « Testons : maquette avec vos données en deux semaines. Si personne ne l'ouvre, on s'arrête là. » |
| « Combien ? » | « Commençons par la maquette : [prix]. Je chiffre l'intégration après, quand j'aurai vu vos données. » |
| « On le fera en interne. » | « Parfait, la démo est ouverte. Si vous voulez gagner trois semaines, je suis là. » |

---

## 8. Les erreurs classiques (à éviter)

- **Chiffrer l'intégration au premier rendez-vous.** Tu te trompes forcément, dans un sens ou
  dans l'autre.
- **Faire la maquette gratuitement sans rien demander en retour.** Si tu l'offres, demande le
  droit de la montrer (anonymisée) et un rendez-vous de présentation avec le décideur.
- **Accepter un fichier « qu'on vous enverra la semaine prochaine ».** Sans données, pas de
  démarrage : mets la réception de l'export comme date de début dans le devis.
- **Livrer sans procès-verbal.** Le « il manque juste… » n'a pas de fin sans document signé.
- **Oublier le suivi.** Une carte qui n'est plus à jour au bout de trois mois te dessert ;
  propose le suivi dès l'intégration.

---

## 9. Récapitulatif en une ligne par marche

```
Contact (30 min)  →  Cadrage (1 sem.)   →  Maquette (1–2 sem.)  →  Intégration (3–6 sem.)  →  Suivi (mensuel)
« Qu'est-ce que      Document d'une        Sa carte, ses vraies    Branchée, sécurisée,        Hébergement,
  vous cliqueriez ? »  page + capture        données, par lien       formée, livrée              mises à jour
gratuit               500–1 500 € / offert  1 500–3 000 €           6 000–15 000 €              200–500 €/mois
```
