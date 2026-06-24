import mongoose from 'mongoose'
import Product from './models/Product.js'
import Sale from './models/Sale.js'
import PurchaseOrder from './models/PurchaseOrder.js'
import dotenv from 'dotenv'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jewelry-admin'

async function clearDatabase() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    const productResult = await Product.deleteMany({})
    console.log(`Deleted ${productResult.deletedCount} products`)

    const saleResult = await Sale.deleteMany({})
    console.log(`Deleted ${saleResult.deletedCount} sales`)

    const poResult = await PurchaseOrder.deleteMany({})
    console.log(`Deleted ${poResult.deletedCount} purchase orders`)

    await mongoose.disconnect()
    console.log('Database cleared and disconnected')
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

clearDatabase()
