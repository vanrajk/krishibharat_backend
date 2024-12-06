const UserModel = require('../models/UserModel');
const CredentialModel = require('../models/CredentialModel');
const BaseController = require('../system/BaseController');
const SECRET_KEYS = require('../config/config').SECRET_KEYS;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const BankModel = require('../models/BankModel')
const KycModel = require('../models/KycModel')
class AuthController extends BaseController {
    constructor() {
        super();
        this.userModel = new UserModel();
        this.credentialModel = new CredentialModel();
        this.kycModel = new KycModel();
        this.bankModel = new BankModel();
    }

    async register(req, res) {
        try {
            const { phone, email, password, fname, mname, lname, dob, title } = req.body;
            
            const existingUser = await this.credentialModel.where('email',email).getRow();
            if (existingUser) {
                return this.sendError(res, 'User already exists', 400);
            }
            const user_id = await this.userModel.insert({fname, mname, lname, dob, title});
            if (user_id > 0){
            await this.bankModel.insert({user_id});
            await this.kycModel.insert({user_id})
            const credential_Id = await this.credentialModel.insert({ phone, email, password, user_id});
            this.sendResponse(res, { user_id: user_id,credential_Id: credential_Id, message: 'User registered successfully...' }, 201);
            } else {
                this.sendError(res, { user_id: user_id, message: 'User registered successfully' }, 500); 
            }
           
        } catch (error) {
            this.sendError(res, error.message, 400);
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await this.credentialModel.where('email',email).getResult();

            if (!user) {
                return this.sendError(res, 'Invalid credentials', 401);
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return this.sendError(res, 'Invalid credentials', 401);
            }
            const user_data = await this.userModel.where('id',user.user_id).getResult();
            const token = jwt.sign(
                { userId: user.user_id, email: user.email, user_type: user_data.user_type },
                SECRET_KEYS.JWT_SECRET,
                { expiresIn: '30h' }
            );
            const user_type = user_data.user_type;
            this.sendResponse(res, { token, user_type });
        } catch (error) {
            this.sendError(res, error.message, 400);
        }
    }

    async logout(req, res) {
       
        this.sendResponse(res, { message: 'Logged out successfully' });
    }

    async getProfile(req, res) {
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
            const user = await this.userModel.where('id',userId).getResult();
            const bank = await this.bankModel.where('user_id',userId).getResult();
            const kyc = await this.kycModel.where('user_id',userId).getResult();
            if (user) {
                const { password, ...user_info } = user;
                this.sendResponse(res, {user_info,bank,kyc});
                        } else {
                this.sendError(res, 'User not found', 404);
            }
          
        } catch (error) {
            this.sendError(res, error.message, 400);
        }
    }

    async refreshToken(req, res) {
        try {
            const user = await this.CredentialModel.find(req.userId);
            if (!user) {
                return this.sendError(res, 'User not found', 404);
            }

            const token = jwt.sign(
                { userId: user.user_id, email: user.email },
                this.JWT_SECRET,
                { expiresIn: '1h' }
            );

            this.sendResponse(res, { token });
        } catch (error) {
            this.sendError(res, error.message, 400);
        }
    }
}

module.exports = AuthController;
