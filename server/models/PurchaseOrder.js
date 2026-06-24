import mongoose from 'mongoose'

const poItemSchema = new mongoose.Schema({
  pid: { type: String, required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  qty: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  receivedQty: { type: Number, default: 0 }
}, { _id: false })

const purchaseOrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  supplier: { type: String, default: '' },
  items: { type: [poItemSchema], default: [] },
  status: { type: String, enum: ['pending', 'partial', 'received', 'cancelled'], default: 'pending' },
  date: { type: Date, default: Date.now },
  totalCost: { type: Number, default: 0 },
  note: { type: String, default: '' }
}, { timestamps: true })

export default mongoose.model('PurchaseOrder', purchaseOrderSchema)
