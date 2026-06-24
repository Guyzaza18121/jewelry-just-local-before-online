const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, opts = {}) {
  const url = `${API_URL}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const api = {
  // Products
  getProducts: () => request('/products'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (body) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  bulkUpdateProducts: (updates) => request('/products/bulk', { method: 'POST', body: JSON.stringify({ updates }) }),

  // Sales
  getSales: () => request('/sales'),
  createSale: (body) => request('/sales', { method: 'POST', body: JSON.stringify(body) }),
  deleteSale: (id) => request(`/sales/${id}`, { method: 'DELETE' }),

  // Backup
  exportBackup: () => request('/backup'),
  restoreBackup: (body) => request('/backup/restore', { method: 'POST', body: JSON.stringify(body) }),
}
