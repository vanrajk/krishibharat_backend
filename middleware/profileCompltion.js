const jwt = require('jsonwebtoken');
const SECRET_KEYS = require('../config/config').SECRET_KEYS;
const UserModel = require('../models/UserModel');
const { use } = require('../routes/CropRoutes');
const userModel = new UserModel();

const profileCompletion = async (req, res, next) => { 
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization token missing or invalid' });
        }

        const token = authHeader.split(' ')[1];
        
        let decoded;
        try {
            decoded = jwt.verify(token, SECRET_KEYS.JWT_SECRET); 
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const userId = decoded.userId;
        
        const user = await userModel.where('id',userId).getResult();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        

        if (user.completion_status != 0) {
            return next();
        } else {
            return res.status(400).json({ message: 'Profile is not completed',status: false});
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' + error});
    }
};

module.exports = profileCompletion;
