const express = require('express');
const AuthController = require('../controllers/Auth');
const router = express.Router();
const authController = new AuthController(); 

// Route to get all users
router.post('/', async (req, res, next) => {
    try {
        await authController.login(req, res);
    } catch (err) {
        next(err);
    }
});

// Route to get a user by ID
router.post('/register', async (req, res, next) => {
    try {
        await authController.register(req, res);
    } catch (err) {
        next(err);
    }
});

router.get('/profile',async (req, res, next) => {
    try{
        await authController.getProfile(req, res);
    } catch (err){
        next(err);
    }
})


module.exports = router;
