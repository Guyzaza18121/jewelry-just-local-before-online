import express from 'express'
import Product from '../models/Product.js'

const router = express.Router()

function cleanBody(body) {
  const { _id, __v, createdAt, updatedAt, addQty, removeQty, ...rest } = body
  return rest
}

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET single product by id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id })
    if (!product) return res.status(404).json({ error: 'Not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create product
router.post('/', async (req, res) => {
  try {
    const body = cleanBody(req.body)

    // Validation
    if (!body.name || !body.sku) return res.status(400).json({ error: 'ชื่อและรหัสสินค้าจำเป็น' })
    if (Number(body.price) < 0) return res.status(400).json({ error: 'ราคาขายต้องไม่ติดลบ' })
    if (Number(body.cost) < 0) return res.status(400).json({ error: 'ราคาทุนต้องไม่ติดลบ' })
    if (Number(body.stock) < 0) return res.status(400).json({ error: 'สต็อกต้องไม่ติดลบ' })

    const exists = await Product.findOne({ sku: body.sku })
    if (exists) return res.status(400).json({ error: 'รหัสสินค้าซ้ำ' })

    // Generate unique product ID server-side
    const existingIds = await Product.distinct('id')
    const nums = existingIds.map(id => parseInt(id.replace('P', ''), 10)).filter(n => !isNaN(n))
    let nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1
    while (existingIds.includes('P' + String(nextNum).padStart(3, '0'))) {
      nextNum++
    }
    body.id = 'P' + String(nextNum).padStart(3, '0')

    const product = new Product(body)
    await product.save()
    res.status(201).json(product)
  } catch (err) {
    console.error('CREATE PRODUCT ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const body = cleanBody(req.body)

    // Validation
    if (body.price !== undefined && Number(body.price) < 0) return res.status(400).json({ error: 'ราคาขายต้องไม่ติดลบ' })
    if (body.cost !== undefined && Number(body.cost) < 0) return res.status(400).json({ error: 'ราคาทุนต้องไม่ติดลบ' })
    if (body.stock !== undefined && Number(body.stock) < 0) return res.status(400).json({ error: 'สต็อกต้องไม่ติดลบ' })

    if (body.sku) {
      const dup = await Product.findOne({ sku: body.sku, id: { $ne: req.params.id } })
      if (dup) return res.status(400).json({ error: 'รหัสสินค้าซ้ำ' })
    }
    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      body,
      { new: true }
    )
    if (!product) return res.status(404).json({ error: 'ไม่พบสินค้า' })
    res.json(product)
  } catch (err) {
    console.error('UPDATE PRODUCT ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id })
    if (!product) return res.status(404).json({ error: 'ไม่พบสินค้า' })
    res.json({ message: 'ลบสำเร็จ' })
  } catch (err) {
    console.error('DELETE PRODUCT ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST bulk update products (for stock changes after sale/void)
router.post('/bulk', async (req, res) => {
  try {
    const { updates } = req.body
    for (const u of updates) {
      if (u.data.stock !== undefined && Number(u.data.stock) < 0) {
        return res.status(400).json({ error: 'สต็อกต้องไม่ติดลบ' })
      }
      await Product.findOneAndUpdate({ id: u.id }, u.data)
    }
    const products = await Product.find().sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    console.error('BULK UPDATE ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
