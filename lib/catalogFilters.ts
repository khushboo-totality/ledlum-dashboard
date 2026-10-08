// Client-safe constants shared by the catalogue filter UI (CatalogPage, Toolbar).

/** Special Subcategory value: "New" products (ledlum_products.product_type = 'new')
 * instead of a real group_name. Selected by default for collections that have any. */
export const NEW_GROUP = '__new__'
export const NEW_GROUP_LABEL = 'New'

/** True for products flagged as new arrivals (ledlum_products.product_type = 'new'). */
export function isNewProduct(p: { product_type?: string | null }): boolean {
  return p.product_type?.trim().toLowerCase() === 'new'
}
