// Script to print all stores in MongoDB for verification
require("dotenv").config();
const Store = require("./models/Store");
const connectDB = require("./config/db");
const mongoose = require("mongoose");

async function listStores() {
  await connectDB();
  const stores = await Store.find({});
  for (const s of stores) {
    console.log({
      name: s.name,
      coordinates: s.location?.coordinates
    });
  }
  console.log(`Total stores: ${stores.length}`);
  await mongoose.disconnect();
}

listStores();
