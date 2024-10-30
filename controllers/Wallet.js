const UserModel = require('../models/UserModel');
const BaseController = require('../system/BaseController');
const SECRET_KEYS = require('../config/config').SECRET_KEYS;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const AuctionModel = require('../models/AuctionModel');
const TransectionModel = require('../models/TransectionModel');
const WalletModel = require('../models/WalletModel');

class Wallet extends BaseController {

    constructor(){
        super();
         this.userModel = new UserModel();
         this.auctionModel = new AuctionModel();
         this.transectionModel = new TransectionModel();
         this.walletModel = new WalletModel();
    }    

    async balance (req, res) {
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
           const result = await this.walletModel.select('closing')
            .where('user_id', userId)
            .orderBy('id', 'DESC')
            .limit(1)
            .getRow();

            const  balance = result !== null ? result : "0";
          return  this.sendResponse(res, balance);

        } catch (error) {
            this.sendError(res, error.message);

        }
    }


    async list(req, res){
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
            

            
    
            const wallatTrn = await this.walletModel.where('user_id',userId).getResultArray();
            this.sendResponse(res, wallatTrn , 200);

           
            
                
            } catch (error) {
                this.sendError(res, error.message);
    
            }
    
    }
}

module.exports = Wallet;