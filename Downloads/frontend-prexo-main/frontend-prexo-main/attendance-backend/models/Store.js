const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({

name: String,

location: {
type: {
type: String,
enum: ["Point"],
default: "Point"
},
coordinates: {
type: [Number], // [longitude, latitude]
required: true
}
}

});

storeSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Store", storeSchema);