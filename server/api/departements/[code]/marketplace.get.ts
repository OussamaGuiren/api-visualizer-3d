import type { DeptCode, DeptRaw, Marketplace } from '~/types/departements'
import demo from '../../../../app/assets/data/departements-info.json'

/**
 * GET /api/departements/:code/marketplace
 *
 * Vendeurs, acheteurs et produits d'un département — chargés à la demande
 * quand l'utilisateur clique sur un territoire. Dans un projet réel :
 *
 *   const vendeurs  = await db.vendeurs.findMany({ where: { codeDept: code }, orderBy: { ventes: 'desc' }, take: 10 })
 *   const acheteurs = await db.acheteurs.findMany({ where: { codeDept: code }, orderBy: { montant: 'desc' }, take: 10 })
 *   const produits  = await db.produits.findMany({ where: { vendeur: { codeDept: code } }, orderBy: { ventes: 'desc' }, take: 10 })
 *   return { code, vendeurs, acheteurs, produits }
 */
export default defineEventHandler((event): Marketplace => {
  const code = getRouterParam(event, 'code') as DeptCode
  const dept = (demo as Record<DeptCode, DeptRaw>)[code]
  if (!dept) throw createError({ statusCode: 404, statusMessage: `Département ${code} inconnu` })
  return buildMarketplace(code, dept)
})
