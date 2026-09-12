import type { Acheteur, DeptCode, DeptRaw, Marketplace, Produit, Vendeur } from '~/types/departements'

/**
 * Générateur déterministe de données marketplace fictives : pour un code
 * département donné, on obtient toujours les mêmes vendeurs, acheteurs et
 * produits. Dans un projet réel, ce module disparaît au profit d'une requête
 * vers la base de la marketplace (voir docs/INTEGRATION.md).
 */

const CATEGORIES = ['Épicerie fine', 'Artisanat', 'Mode & textile', 'Maison & déco', 'Bien-être', 'High-tech', 'Sport & loisirs', 'Jardin']
const PREFIXES = ['Atelier', 'Maison', 'Les Jardins de', 'Comptoir', 'La Fabrique', 'Domaine', 'Boutique', 'Manufacture', 'Ferme', 'Studio']
const SUFFIXES = ['du Marché', 'des Halles', 'Saint-Martin', 'de la Gare', 'du Centre', 'Bellevue', 'des Vignes', 'du Port', 'des Arts', 'Grand-Rue']
const PRODUITS: Record<string, string[]> = {
  'Épicerie fine': ['Huile d’olive AOP', 'Miel de châtaignier', 'Confit de canard', 'Terrine maison', 'Sel de Guérande'],
  Artisanat: ['Vase céramique', 'Planche en chêne', 'Panier osier', 'Savon artisanal', 'Bougie coulée main'],
  'Mode & textile': ['Écharpe en laine', 'Sac cabas lin', 'Chemise coton bio', 'Espadrilles', 'Béret feutre'],
  'Maison & déco': ['Lampe bois tourné', 'Coussin brodé', 'Cadre chêne', 'Miroir rotin', 'Tapis tissé'],
  'Bien-être': ['Huile de massage', 'Tisane relaxante', 'Baume réparateur', 'Gommage corps', 'Bougie parfumée'],
  'High-tech': ['Enceinte nomade', 'Chargeur solaire', 'Support tablette', 'Câble tressé', 'Lampe connectée'],
  'Sport & loisirs': ['Gourde isotherme', 'Tapis de yoga', 'Sac de rando', 'Frisbee bois', 'Ballon cuir'],
  Jardin: ['Plants aromatiques', 'Sécateur forgé', 'Composteur', 'Jardinière zinc', 'Graines anciennes'],
}
const ENTREPRISES = ['Bistrot', 'Hôtel', 'Cave', 'Conciergerie', 'Coopérative', 'Galerie', 'Camping', 'Librairie']
const COLLECTIVITES = ['Mairie', 'Communauté de communes', 'Office de tourisme', 'Lycée', 'CCAS']

/** Petit PRNG (mulberry32) initialisé par une chaîne : reproductible par département. */
function rng(seed: string) {
  let h = 1779033703 ^ seed.length
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 3432918353)
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T>(random: () => number, list: readonly T[]): T => list[Math.floor(random() * list.length)]!
const between = (random: () => number, min: number, max: number) => min + random() * (max - min)

export function buildMarketplace(code: DeptCode, dept: DeptRaw): Marketplace {
  const random = rng(`marketplace-${code}`)
  const villes = [dept.ville, `${dept.ville}-Sud`, `Saint-Pierre-de-${dept.nom.split(' ')[0]}`, `${dept.ville} Nord`]

  // Le nombre de vendeurs suit le volume de clients du département.
  const nbVendeurs = Math.max(3, Math.min(9, Math.round(dept.clients / 25)))
  const vendeurs: Vendeur[] = Array.from({ length: nbVendeurs }, (_, i) => {
    const categorie = pick(random, CATEGORIES)
    return {
      id: `${code}-v${i + 1}`,
      nom: `${pick(random, PREFIXES)} ${pick(random, SUFFIXES)}`,
      ville: pick(random, villes),
      categorie,
      note: Math.round(between(random, 3.6, 5) * 10) / 10,
      produits: Math.round(between(random, 4, 60)),
      ventes: Math.round(between(random, 8, dept.ca / nbVendeurs) * 10) / 10,
      depuis: Math.round(between(random, 2015, 2025)),
    }
  }).sort((a, b) => b.ventes - a.ventes)

  const acheteurs: Acheteur[] = Array.from({ length: 6 }, (_, i) => {
    const roll = random()
    const type: Acheteur['type'] = roll < 0.5 ? 'Entreprise' : roll < 0.75 ? 'Collectivité' : 'Particulier'
    const ville = pick(random, villes)
    const nom =
      type === 'Entreprise'
        ? `${pick(random, ENTREPRISES)} ${pick(random, SUFFIXES)}`
        : type === 'Collectivité'
          ? `${pick(random, COLLECTIVITES)} de ${ville}`
          : `Client particulier · ${ville}`
    const commandes = Math.round(between(random, 2, type === 'Particulier' ? 12 : 60))
    return {
      id: `${code}-a${i + 1}`,
      nom,
      ville,
      type,
      commandes,
      montant: Math.round(commandes * between(random, 0.15, 1.2) * 10) / 10,
    }
  }).sort((a, b) => b.montant - a.montant)

  const produits: Produit[] = Array.from({ length: 6 }, (_, i) => {
    const vendeur = pick(random, vendeurs)
    const nom = pick(random, PRODUITS[vendeur.categorie] ?? PRODUITS.Artisanat!)
    return {
      id: `${code}-p${i + 1}`,
      nom,
      categorie: vendeur.categorie,
      vendeur: vendeur.nom,
      prix: Math.round(between(random, 9, 240)),
      ventes: Math.round(between(random, 20, 900)),
    }
  }).sort((a, b) => b.ventes - a.ventes)

  return { code, vendeurs, acheteurs, produits }
}
