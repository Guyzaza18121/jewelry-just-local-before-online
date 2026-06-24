export function isUploadedImage(img) {
  return typeof img === 'string' && img.startsWith('data:image/')
}

export function getStockStatus(p) {
  const stock = Number(p.stock)||0
  if (stock===0) return 'inactive'
  if (stock<2) return 'low'
  return 'active'
}
