const express = require('express');
const Wallet = require('../controllers/Wallet');
const router = express.Router();
const wallet = new Wallet();
router.get('/balance', async (req, res, next) => {
    try {
        await wallet.balance(req, res);
    } catch (err) {
        next(err);
    }
});


router.get('/',async (req, res, next) => {
    try {
        await wallet.list(req, res);
    } catch (error) {
        next(error);
    }
})


module.exports = router;
