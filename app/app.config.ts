/**
 * Informations affichées dans les appels à contact (encarts, modale « Contact »).
 * À adapter : ces valeurs apparaissent telles quelles dans l'interface.
 */
export default defineAppConfig({
  author: {
    name: 'Oussama Guiren',
    role: 'Développeur front-end · data-visualisation 3D',
    email: 'oguiren@yahoo.com',
    /** Objet pré-rempli du mail de contact. */
    subject: 'Une carte 3D pour nos données',
  },
  promo: {
    /** Délai avant le premier encart (ms). */
    firstDelayMs: 25_000,
    /** Nombre d'interactions (sélections, changements d'indicateur) déclenchant un encart. */
    interactionsThreshold: 3,
    /** Encarts maximum par session. */
    maxPerSession: 2,
  },
})
