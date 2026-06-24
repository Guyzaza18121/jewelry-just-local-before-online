import express from 'express'
import Product from '../models/Product.js'
import Sale from '../models/Sale.js'
import PurchaseOrder from '../models/PurchaseOrder.js'

const router = express.Router()

// GET export all data
router.get('/', async (req, res) => {
  try {
    const [products, sales, purchaseOrders] = await Promise.all([
      Product.find().lean(),
      Sale.find().lean(),
      PurchaseOrder.find().lean()
    ])
    res.json({ products, sales, purchaseOrders, exportedAt: new Date().toISOString() })
  } catch (err) {
    console.error('BACKUP EXPORT ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST import/restore data (upsert by id)
router.post('/restore', async (req, res) => {
  try {
    const { products = [], sales = [], purchaseOrders = [] } = req.body
    const results = { products: 0, sales: 0, purchaseOrders: 0, errors: [] }

    function cleanDoc(doc) {
      const { _id, __v, createdAt, updatedAt, addQty, removeQty, ...rest } = doc
      return rest
    }

    if (products.length > 0) {
      const ops = products.map(p => ({
        updateOne: { filter: { id: p.id }, update: { $set: cleanDoc(p) }, upsert: true }
      }))
      const r = await Product.bulkWrite(ops)
      results.products = r.upsertedCount + r.modifiedCount
    }
    if (sales.length > 0) {
      const ops = sales.map(s => ({
        updateOne: { filter: { id: s.id }, update: { $set: cleanDoc(s) }, upsert: true }
      }))
      const r = await Sale.bulkWrite(ops)
      results.sales = r.upsertedCount + r.modifiedCount
    }
    if (purchaseOrders.length > 0) {
      const ops = purchaseOrders.map(po => ({
        updateOne: { filter: { id: po.id }, update: { $set: cleanDoc(po) }, upsert: true }
      }))
      const r = await PurchaseOrder.bulkWrite(ops)
      results.purchaseOrders = r.upsertedCount + r.modifiedCount
    }

    res.json({ message: 'นำเข้าสำเร็จ', results })
  } catch (err) {
    console.error('BACKUP RESTORE ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
