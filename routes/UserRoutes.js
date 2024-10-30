const express = require('express');
const UserController = require('../controllers/User');
const router = express.Router();
const userController = new UserController();
const uploader = require('../middleware/uploader');
const parseBodyMiddleware = require('../middleware/parseBodyMiddleware');

const uploadFields = [
    { name: 'bank_image[]', maxCount: 1 },
    { name: 'kyc_image[]', maxCount: 1 },

];

// Route to get all users
router.get('/', async (req, res, next) => {
    
    try {
        await userController.getAllUsers(req, res);
    } catch (err) {
        next(err);
    }
});
router.get('/profile', async (req, res, next) => {
    
    try {
        await userController.userDetiles(req, res);
    } catch (err) {
        next(err);
    }
});

// Route to get a user by ID
router.get('/:id', async (req, res, next) => {
    try {
        await userController.getUserById(req, res);
    } catch (err) {
        next(err);
    }
});

// Route to create a new user
router.post('/', async (req, res, next) => {
    try {
        await userController.createUser(req, res);
    } catch (err) {
        next(err);
    }
});

// Route to update a user by ID with file uploads
router.post('/update',parseBodyMiddleware, uploader.fields(uploadFields), async (req, res, next) => {
    try {
        await userController.updateUser(req, res);
    } catch (err) {
        next(err);
    }
});


// Route to delete a user by ID
router.delete('/:id', async (req, res, next) => {
    try {
        await userController.deleteUser(req, res);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
