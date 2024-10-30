const express = require('express');
const Payment = require('../controllers/Payment');
const Wallet = require('../controllers/Wallet');
const router = express.Router();
const wallet = new Wallet();
const payment = new Payment();
router.post('/topup', async (req, res, next) => {
    try {
        await payment.add(req, res);
    } catch (err) {
        next(err);
    }
});

router.post('/success', async (req, res, next) => {
    try {
        await payment.success(req, res);
    } catch (err) {
        next(err);
    }
});
router.get('/', async (req, res, next) => {
    try {
        await payment.list(req, res);
    } catch (err) {
        next(err);
    }
});


module.exports = router;
