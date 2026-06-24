import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  cat: { type: String, default: '' },
  price: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  sold: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
  sizes: { type: [String], default: [] },
  supplier: { type: String, default: '' },
  supSku: { type: String, default: '' },
  img: { type: String, default: '' },
  img2: { type: String, default: '' },
  costBreak: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true })

export default mongoose.model('Product', productSchema)
