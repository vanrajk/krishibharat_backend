const express = require('express');
const Crop = require('../controllers/Crop');
const router = express.Router();
const crop = new Crop();
router.post('/add', async (req, res, next) => {
    try {
        await crop.add(req, res);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
