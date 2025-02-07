const express = require('express');
const Contracts = require('../controllers/Contracts');
const router = express.Router();
const contracts = new Contracts();
router.post('/updateContract', async (req, res, next) => {
    try {
        await contracts.updateContract(req, res);
    } catch (err) {
        next(err);
    }
});


router.get('/',async (req, res, next) => {
    try {
        await contracts.list(req, res);
    } catch (error) {
        next(error);
    }
})


module.exports = router;
