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


router.get('/',async (req, res, next) => {
    try {
        await crop.list(req, res);
    } catch (error) {
        next(error);
    }
})
router.get('/published',async (req, res, next) => {
    try {
        await crop.getPublishedCrops(req, res);
    } catch (error) {
        next(error);
    }
})
router.get('/counts',async (req, res, next) => {
    try {
        await crop.countCrops(req, res);
    } catch (error) {
        next(error);
    }
})

router.post('/publish/:id',async (req,res,next) => {
    try {
        await crop.publish(req, res);
    } catch (error) {
        next(error)
    }
})
router.put('/:id',async (req,res,next) => {
    try {
        await crop.update(req, res);
    } catch (error) {
        next(error)
    }
})

router.get('/zone/:zone_id', async (req, res, next) => {
    try {
        await crop.getCropsByZone(req.params.zone_id);
    } catch (error) {
        next(error);
    }
});

router.post('/auction', async (req, res, next) => {
    try {
        await crop.createAuction(req, res);
    } catch (error) {
        next(error);
    }
});

router.get('/zones', async (req, res, next) => {
    try {
        await crop.listZones(req, res);
    } catch (error) {
        next(error);
    }
});
router.post('/place_bid', async (req, res, next) => {
    try {
        await crop.placeBid(req, res);
    } catch (error) {
        next(error);
    }
});

router.get('/merhent', async (req, res, next) => {
    try {
        await crop.getMerchentsCrops(req, res);
    } catch (error) {
        next(error);
    }
});
module.exports = router;
