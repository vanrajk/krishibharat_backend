const UserModel = require('../models/UserModel');
const BaseController = require('../system/BaseController');
const bcrypt =  require('bcrypt');
const BankModel = require('../models/BankModel')
const KycModel = require('../models/KycModel')
const SECRET_KEYS = require('../config/config').SECRET_KEYS;
const jwt = require('jsonwebtoken'); 
const { use } = require('../routes/UserRoutes');

class UserController extends BaseController {
    constructor() {
        super();
        this.userModel = new UserModel();
        this.kycModel = new KycModel();
        this.bankModel = new BankModel();
    }

    async getAllUsers(req, res) {
        try {
            const users = await this.userModel.findAll();
            this.sendResponse(res, users);
        } catch (error) {
            this.sendError(res, error.message);
        }
    }

    async getUserById(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Authorization token missing or invalid!!!' });
            }
    
            const token = authHeader.split(' ')[1];
            console.log(SECRET_KEYS.JWT_SECRET);

            let decoded;
            try {
                
                decoded = jwt.verify(token, SECRET_KEYS.JWT_SECRET); 
            } catch (err) {
                return res.status(401).json({ message: 'Invalid or expired token' + err });
            }
    
            const userId = decoded.userId;
            const user = await this.userModel.find(userId);
            if (user) {
                this.sendResponse(res, user);
            } else {
                this.sendError(res, 'User not found', 404);
            }
        } catch (error) {
            this.sendError(res, error.message);
        }
    }

    async createUser(req, res) {
        try {
            const userId = await this.userModel.insert(req.body);
            this.sendResponse(res, { id: userId, message: 'User created successfully' }, 201);
        } catch (error) {
            this.sendError(res, error.message, 400);
        }
    }

    async updateUser(req, res) {
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

            // Extract JSON data and files

            // Parse JSON data from body
          	let body = req.body
            // Extract JSON data and files
            const profile = body.user_info || {};
            const bank = body.bank || {};
            const kyc = body.kyc || {};

          
            // Update user profile

            // Update bank details
            const bankData = { ...bank };
           
            await this.bankModel.where('user_id', userId).update(bankData);

            // Update KYC details
            const kycData = { ...kyc };
            
            await this.kycModel.where('user_id', userId).update(kycData);
            profile.completion_status = 1;
            await this.userModel.where('id', userId).update(profile);


            this.sendResponse(res, { message: 'User updated successfully' });
        } catch (error) {
            this.sendError(res, error.message, 400);
        }
    }


    async deleteUser(req, res) {
        try {
            await this.userModel.delete(req.params.id);
            this.sendResponse(res, { message: 'User deleted successfully' });
        } catch (error) {
            this.sendError(res, error.message);
        }
    }

    async userDetiles(req, res){
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
            const userData = await this.userModel.select(['title','fname','lname']).where('id',userId).getResult();
            this.sendResponse(res, userData);
        } catch (error) {
            this.sendError(res, error.message);
        }
    }
}

module.exports = UserController;
