
const UserModel = require('../models/UserModel');
const BaseController = require('../system/BaseController');
const SECRET_KEYS = require('../config/config').SECRET_KEYS;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const AuctionModel = require('../models/AuctionModel');
const TransectionModel = require('../models/TransectionModel');
const WalletModel = require('../models/WalletModel');
const PaymentModel = require('../models/PaymentModel');
require('dotenv').config({path : `${process.cwd()}/.env`})

class Payment extends BaseController {

    constructor(){
        super();
         this.userModel = new UserModel();
         this.auctionModel = new AuctionModel();
         this.transectionModel = new TransectionModel();
         this.walletModel = new WalletModel();
         this.paymentModel = new PaymentModel();
    }    

    async add(req,res) {
        try {
            
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Authorization token missing or invalid' });
            }
    
            const token = authHeader.split(' ')[1];
            console.log(SECRET_KEYS.JWT_SECRET);

            let decoded;
            try {
                
                decoded = jwt.verify(token, SECRET_KEYS.JWT_SECRET); 
            } catch (err) {
                return res.status(401).json({ message: 'Invalid or expired token' + err });
            }
    
            const user_id = decoded.userId;
        const { amount } = req.body;
        const py_amount = amount / 100;
        const order_id = await this.genrateOrderderId(user_id, amount);
        const payment_add = await this.paymentInsert(order_id.id, py_amount , user_id);
       

        if (payment_add > 0){
            return this.sendResponse(res, { order_id: order_id.id, paymentId: payment_add, message: 'Order ID genrated successfully' }, 201);
            } else {
                this.sendError(res, { user_id: user_id, message: 'Order ID genrated successfully' }, 500); 
            } 
        } catch (error) {
            this.sendError(res, error.message);

        }
    }

    async paymentInsert(order_id, amount, user_id){
        const status = "pending";
        const paymentId = await this.paymentModel.insert({order_id, amount, user_id, status})
        return paymentId;
    }
    async genrateOrderderId(user_id, amount){
        const Razorpay = require('razorpay');

        var instance = new Razorpay({
        key_id: process.env.KEY_ID,
        key_secret: process.env.KEY_SECRET,
        });

        const order_id = instance.orders.create({
            "amount": amount,
            "currency": "INR",
            "receipt": await this.generateReceiptNumber(user_id),
            "notes": {
              "user_id": user_id,
            }
          })

          return order_id;
    }

    async generateReceiptNumber(userId) {
        const timestamp = Date.now(); // Get the current timestamp in milliseconds
        return `REC-${userId}-${timestamp}`;
    }

    async success(req, res) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization token missing or invalid' });
        }
    
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, SECRET_KEYS.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token ' + err });
        }
    
        const user_id = decoded.userId;
        const { order_id } = req.body;
        const status = "success";
        const gateway ='Razorpay';

        // Update payment status to 'success'
        await this.paymentModel.where('order_id', order_id).update({ status, gateway });
        const paymentRecord = await this.paymentModel.where('order_id', order_id).first();
        if (!paymentRecord) {
            return res.status(404).json({ message: 'Payment record not found' });
        }
        const trn_id = paymentRecord.id; // Use paymentRecord.id for trn_id in the wallet entry
        const amount = parseInt(paymentRecord.amount, 10); 
        const lastWalletEntry = await this.walletModel.where('user_id', user_id).orderBy('id', 'desc').first();
    
        const openingBalance = lastWalletEntry ? parseInt(lastWalletEntry.closing, 10) : 0;
        const closingBalance = openingBalance + amount;
    
        const transactionData = {
            trn_id: trn_id,
            user_id: user_id,
            opening: openingBalance,
            amount: amount,
            closing: closingBalance,
            status: status,
            gateway: gateway,
            created_at: new Date()
        };
    
        const walletUpdate = await this.walletModel.insert(transactionData);
    
        if (walletUpdate > 0) {
            return this.sendResponse(res, { message: 'Payment success and wallet updated successfully' }, 200);
        } else {
            return this.sendError(res, { message: 'Failed to update wallet' }, 500);
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
            

            
    
            const trnList = await this.paymentModel.where('user_id',userId).getResultArray();
            this.sendResponse(res, trnList , 200);

           
            
                
            } catch (error) {
                this.sendError(res, error.message);
    
            }
    
    }

}

module.exports = Payment;