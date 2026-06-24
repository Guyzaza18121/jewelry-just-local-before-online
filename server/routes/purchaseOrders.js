import express from 'express'
import PurchaseOrder from '../models/PurchaseOrder.js'
import Product from '../models/Product.js'

const router = express.Router()

function cleanBody(body) {
  const { _id, __v, createdAt, updatedAt, ...rest } = body
  return rest
}

// GET all POs
router.get('/', async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().sort({ createdAt: -1 })
    res.json(pos)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create PO
router.post('/', async (req, res) => {
  try {
    const body = cleanBody(req.body)
    const existingIds = await PurchaseOrder.distinct('id')
    const nums = existingIds.map(id => parseInt(id.replace('PO', ''), 10)).filter(n => !isNaN(n))
    let nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1
    while (existingIds.includes('PO' + String(nextNum).padStart(3, '0'))) {
      nextNum++
    }
    body.id = 'PO' + String(nextNum).padStart(3, '0')
    const totalCost = (body.items || []).reduce((a, it) => a + (it.cost || 0) * (it.qty || 0), 0)
    body.totalCost = totalCost
    const po = new PurchaseOrder(body)
    await po.save()
    res.status(201).json(po)
  } catch (err) {
    console.error('CREATE PO ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

// PUT update PO (receive items, change status)
router.put('/:id', async (req, res) => {
  try {
    const body = cleanBody(req.body)
    if (body.items) {
      const totalCost = body.items.reduce((a, it) => a + (it.cost || 0) * (it.qty || 0), 0)
      body.totalCost = totalCost
    }
    const po = await PurchaseOrder.findOneAndUpdate(
      { id: req.params.id },
      body,
      { new: true }
    )
    if (!po) return res.status(404).json({ error: 'ไม่พบใบสั่งซื้อ' })
    res.json(po)
  } catch (err) {
    console.error('UPDATE PO ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST receive PO items (update stock)
router.post('/:id/receive', async (req, res) => {
  try {
    const { items } = req.body // [{ pid, receivedQty }]
    const po = await PurchaseOrder.findOne({ id: req.params.id })
    if (!po) return res.status(404).json({ error: 'ไม่พบใบสั่งซื้อ' })

    const updatedItems = po.items.map(it => {
      const rec = items.find(r => r.pid === it.pid)
      if (rec) {
        return { ...it.toObject(), receivedQty: Math.min(it.qty, (it.receivedQty || 0) + (rec.receivedQty || 0)) }
      }
      return it.toObject()
    })

    const allReceived = updatedItems.every(it => it.receivedQty >= it.qty)
    const anyReceived = updatedItems.some(it => it.receivedQty > 0)
    const status = allReceived ? 'received' : (anyReceived ? 'partial' : po.status)

    await PurchaseOrder.findOneAndUpdate(
      { id: req.params.id },
      { items: updatedItems, status }
    )

    // Update product stock
    for (const rec of items) {
      if (!rec.receivedQty || rec.receivedQty <= 0) continue
      const product = await Product.findOne({ id: rec.pid })
      if (product) {
        const newStock = (product.stock || 0) + rec.receivedQty
        await Product.findOneAndUpdate(
          { id: rec.pid },
          { stock: newStock, status: newStock === 0 ? 'inactive' : (newStock < 2 ? 'low' : 'active') }
        )
      }
    }

    const updated = await PurchaseOrder.findOne({ id: req.params.id })
    const products = await Product.find().sort({ createdAt: -1 })
    res.json({ po: updated, products })
  } catch (err) {
    console.error('RECEIVE PO ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE PO
router.delete('/:id', async (req, res) => {
  try {
    const po = await PurchaseOrder.findOneAndDelete({ id: req.params.id })
    if (!po) return res.status(404).json({ error: 'ไม่พบใบสั่งซื้อ' })
    res.json({ message: 'ลบสำเร็จ' })
  } catch (err) {
    console.error('DELETE PO ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
