console.log("Store route loaded");
const express = require("express");
const router = express.Router();
const Store = require("../models/Store");
const auth = require("../middleware/auth");

// List all stores
router.get("/", auth, async (req, res) => {
  try {
    const stores = await Store.find().sort({ name: 1 });
    // Map GeoJSON back to lat/long for UI
    const mapped = stores.map(s => ({
      _id: s._id,
      name: s.name,
      latitude: s.location?.coordinates[1] || 0,
      longitude: s.location?.coordinates[0] || 0
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create store
router.post("/create", auth, async (req, res) => {
  try {
    const { name, latitude, longitude } = req.body;
    const store = new Store({
      name,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      }
    });
    await store.save();
    res.json({ message: "Store created successfully", store });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update store
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, latitude, longitude } = req.body;
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      {
        name,
        location: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        }
      },
      { new: true }
    );
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json({ message: "Store updated successfully", store });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete store
router.delete("/:id", auth, async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json({ message: "Store deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;