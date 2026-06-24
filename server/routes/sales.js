import express from 'express'
import Sale from '../models/Sale.js'

const router = express.Router()

function cleanBody(body) {
  const { _id, __v, createdAt, updatedAt, ...rest } = body
  return rest
}

// GET all sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 })
    res.json(sales)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create sale
router.post('/', async (req, res) => {
  try {
    const body = cleanBody(req.body)

    // Generate unique sale ID server-side
    const existingIds = await Sale.distinct('id')
    const nums = existingIds.map(id => parseInt(id.replace('S', ''), 10)).filter(n => !isNaN(n))
    let nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1
    while (existingIds.includes('S' + String(nextNum).padStart(3, '0'))) {
      nextNum++
    }
    body.id = 'S' + String(nextNum).padStart(3, '0')

    const sale = new Sale(body)
    await sale.save()
    res.status(201).json(sale)
  } catch (err) {
    console.error('CREATE SALE ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE sale
router.delete('/:id', async (req, res) => {
  try {
    const sale = await Sale.findOneAndDelete({ id: req.params.id })
    if (!sale) return res.status(404).json({ error: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
