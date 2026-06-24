import mongoose from 'mongoose'

const saleItemSchema = new mongoose.Schema({
  pid: { type: String, required: true },
  name: { type: String, required: true },
  qty: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  size: { type: String, default: '' }
}, { _id: false })

const saleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  items: { type: [saleItemSchema], default: [] },
  total: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  note: { type: String, default: '' }
}, { timestamps: true })

export default mongoose.model('Sale', saleSchema)
