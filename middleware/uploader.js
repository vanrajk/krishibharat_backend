const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken'); 
const SECRET_KEYS = require('../config/config').SECRET_KEYS;

// Define storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {

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
        const folderName = file.fieldname === 'bank_image[]' ? `bank/${userId}` : `kyc/${userId}`;
        const uploadPath = path.join(__dirname, '..', 'upload', folderName);

        // Ensure the directory exists
        fs.mkdir(uploadPath, { recursive: true }, (err) => {
            if (err) return cb(err);
            cb(null, uploadPath);
        });
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Keep the original filename
    }
});

// Initialize multer with storage configuration
const uploader = multer({ storage });

module.exports = uploader;
