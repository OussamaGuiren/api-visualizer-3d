import type { DeptCode, DeptRaw } from '~/types/departements'
import demo from '../../app/assets/data/departements-info.json'

/**
 * GET /api/departements
 *
 * Renvoie les indicateurs de tous les départements, indexés par code INSEE.
 * C'est le SEUL point de contact entre la carte et les données : pour brancher
 * une source réelle, on remplace le contenu de ce handler (requête SQL, appel
 * CRM, lecture d'un export…) en conservant la forme de la réponse.
 *
 * Exemple avec une base SQL :
 *
 *   const rows = await db.query(`
 *     SELECT d.code, d.nom, d.region, d.ville, d.lat, d.lon,
 *            COUNT(DISTINCT c.id)            AS clients,
 *            SUM(f.montant) / 1000           AS ca,
 *            SUM(o.objectif) / 1000          AS objectif
 *     FROM departements d
 *     LEFT JOIN clients  c ON c.code_dept = d.code
 *     LEFT JOIN factures f ON f.client_id = c.id AND f.date >= NOW() - INTERVAL '12 months'
 *     LEFT JOIN objectifs o ON o.code_dept = d.code AND o.annee = EXTRACT(YEAR FROM NOW())
 *     GROUP BY d.code`)
 *   return Object.fromEntries(rows.map((r) => [r.code, r]))
 *
 * Voir docs/INTEGRATION.md pour le détail du contrat.
 */
export default defineEventHandler((): Record<DeptCode, DeptRaw> => {
  // Démo : données fictives embarquées. Un `setResponseHeader(event, 'Cache-Control', …)`
  // ou un `defineCachedEventHandler` conviendrait pour une source réelle rafraîchie chaque nuit.
  return demo as Record<DeptCode, DeptRaw>
})
