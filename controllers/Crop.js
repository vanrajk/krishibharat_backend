const UserModel = require('../models/UserModel');
const BaseController = require('../system/BaseController');
const SECRET_KEYS = require('../config/config').SECRET_KEYS;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const CropsModel = require('../models/CropsModel')
const AuctionModel = require('../models/AuctionModel');
const ZoneModel = require('../models/ZoneModel');
const WallateModel = require('../models/WalletModel');
const ContractsModel = require('../models/ContractsModel');

class Crop extends BaseController {
    constructor(){
        super();
         this.cropModel = new CropsModel();
         this.userModel = new UserModel();
         this.auctionModel = new AuctionModel();
         this.zoneModel = new ZoneModel();
         this.wallateModel = new WallateModel();
         this.ContractsModel = new ContractsModel();
    }    


    async add(req,res) {
        try {
            
       const { token } = req.body
       console.log(token);
       
        
        let decoded;
        try {
            decoded = jwt.verify(token, SECRET_KEYS.JWT_SECRET); 
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token HAI' });
        }

        const seller_id = decoded.userId;
        const { name } = req.body;
        console.log(name);
        const user = await this.userModel.where('id',seller_id).getResult();
        const zone_id = user.state
        const cropId = await this.cropModel.insert({name, seller_id, zone_id})

        if (cropId > 0){
            this.sendResponse(res, { cropId: cropId, message: 'Crop registered successfully' }, 201);
            } else {
                this.sendError(res, { user_id: user_id, message: 'Crop registered successfully' }, 500); 
            }
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
            

            if(decoded.user_type == 'farmer'){
    
                const crops = await this.cropModel.where('seller_id', userId).getResultArray();
            
                // Get crop IDs that are currently in auction
                const auctionedCrops = await this.auctionModel.getResultArray();
                const auctionedCropIds = auctionedCrops.map(auction => auction.crop_id);
    
                // Filter out crops that are in auction
                const availableCrops = crops.filter(crop => !auctionedCropIds.includes(crop.id));
    
                this.sendResponse(res, availableCrops, 200);

            } else{
                const cropList = await this.cropModel.where('buyer_id', userId).getResultArray();

                const fieldsToRemove = ['seller_id', 'trigger_price','created_at']; 
                
                const modifiedCropList = cropList.map(crop => {
                    fieldsToRemove.forEach(field => {
                        delete crop[field];
                    });
                    return crop;
                });
                
                this.sendResponse(res, modifiedCropList, 200);
                

    
            }
               
                  
            } catch (error) {
                this.sendError(res, error.message);
    
            }
    }


    async getPublishedCrops(req, res) {
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
    
            // Check if the user is a farmer
            if (decoded.user_type === 'farmer') {
                // Step 1: Get all crops owned by the farmer
                const farmerCrops = await this.cropModel.where('seller_id', userId).getResultArray(); // Ensure to use seller_id to match your model
                const farmerCropIds = farmerCrops.map(crop => crop.id);
    
                // Step 2: Find auctions for those crops
                const publishedAuctionIds = await this.auctionModel.whereIn('crop_id', farmerCropIds).getResultArray();
    
                // Step 3: Filter farmer crops to include only those in published auctions
                const publishedCropIds = publishedAuctionIds.map(auction => auction.crop_id);
                const publishedCrops = farmerCrops.filter(crop => publishedCropIds.includes(crop.id));
    
                // Step 4: Send the response back
                this.sendResponse(res, publishedCrops, 200);
            } else {
                return res.status(403).json({ message: 'Access denied. Only farmers can view published crops.' });
            }
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
     

    async update(req, res){
        try {
            const { id } = req.params;
            const data = req.body
            const update = await this.cropModel.where('id', id).update(data);
            return this.sendResponse(res, update, 200)
        } catch (error) {
           return this.sendError(res, error.message);

        }
    }
    async publish(req, res) {
        try {
            const { id } = req.params;
            const crop_id = id;
            
            // Check if the crop_id already exists
            const existingAuction = await this.auctionModel.where('crop_id',crop_id).getRow();
            
            if (existingAuction) {
                return this.sendError(res, 'Crop ID already exists in auction', 400);
            }
            
            // If crop_id does not exist, proceed with the insert
            const status = await this.auctionModel.insert({ crop_id });
            return this.sendResponse(res, status, 200);
            
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
    
    async getCropsByZone(zone_id) {
        try {
            const crops = await this.cropModel.where('zone_id',zone_id).where('crop_status',0).getResultArray();
            const ids = crops.map(crop => crop.id);
            const auctions = await this.auctionModel.whereIn('crop_id', ids).getResultArray();
            const au_ids = auctions.map(auction => auction.crop_id);
            const crops_which_is_in_auction = await this.cropModel.whereIn('id',au_ids).getResultArray();
            
           return crops_which_is_in_auction
        } catch (error) {
            return error.message
        }
    }
    async countCrops(req, res) {
        try {
            // Check if authorization token exists and is valid
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
    
            // Extract the user ID and type
            const userId = decoded.userId;
    
            // Check user type (assuming only farmers need to view their crop count)
            if (decoded.user_type !== 'farmer') {
                return res.status(403).json({ message: 'Access denied' });
            }
    
            // Count total crops
            const totalCrops = await this.cropModel.where('seller_id', userId).count();
    
            // Count sold crops (crop_status = 0)
            const soldCrops = await this.cropModel.where('seller_id', userId).where('crop_status', 0).count();
    
            // Return the result
            return this.sendResponse(res, { totalCrops, soldCrops }, 200);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
    
    async createAuction(req, res) {
        try {
            const { crop_id, start_time, end_time } = req.body;
            const auctionId = await this.auctionModel.insert(crop_id, start_time, end_time);
            this.sendResponse(res, { auctionId }, 201);
        } catch (error) {
            this.sendError(res, error.message);
        }
    }

    async listZones(req, res) {
        try {
            const zones = await this.zoneModel.getAll();
            this.sendResponse(res, zones, 200);
        } catch (error) {
            this.sendError(res, error.message);
        }
    }

    async getMerchentsCrops(req, res){
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
    
            const buyer_id = decoded.userId;
            data = await this.cropModel.where('buyer_id',buyer_id).getResultArray();
            return this.sendResponse(res, data, 200);
        } catch (error) {
            return this.sendError(res, error.message);

        }
    }

    async getcropById(req, res) {
        try {
            const { id } = req.body;
            const contract = await this.cropModel.where('id', id).getResult();
            return this.sendResponse(res, contract, 200);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
    async placeBid(req, res) {
        try {
            // 1. Authentication
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Authorization token missing or invalid' });
            }
    
            let decoded;
            try {
                const token = authHeader.split(' ')[1];
                decoded = jwt.verify(token, SECRET_KEYS.JWT_SECRET);
            } catch (err) {
                return res.status(401).json({ message: 'Invalid or expired token' });
            }
            
            // 2. Input validation
            const { id, sold_price } = req.body;
            if (!id || !sold_price) {
                return res.status(400).json({ message: 'Missing required fields' });
            }
            
            // 3. Get crop details
            const crop = await this.cropModel.where('id', id).first();
            if (!crop) {
                return res.status(404).json({ message: 'Crop not found' });
            }
    
            // 4. Update crop data
            const buyer_id = decoded.userId;
            const updateData = {
                buyer_id,
                sold_price
            };
            console.log(crop.trigger_price, sold_price);
            const user_wallate_balance = await this.wallateModel.select('closing')
    .where('user_id', buyer_id)
    .orderBy('id', 'DESC')
    .limit(1)
    .getResult(); // Fetch row as an array

            console.log(user_wallate_balance);
            
            if (user_wallate_balance.closing < sold_price){
                return res.status(404).json({ message: 'Balance inefficient!!' });

            }
             if (sold_price >= crop.trigger_price) {
                updateData.crop_status = '1';
                console.log("sold!!!");
                
                // Create bid record if needed
                
                const seller_id = crop.seller_id;
                const crop_id = id;
                const is_debited = await this.transferFunds(buyer_id, seller_id, sold_price);
                if (!is_debited.success){
                    return res.status(404).json({ message: 'not ttransferting' + is_debited.message });

                }
                await this.ContractsModel.insert({crop_id,seller_id,buyer_id})
            }
    
            const result = await this.cropModel
                .where('id', id)
                .update(updateData);
    
           
    
            return this.sendResponse(res, {
                message: 'Bid placed successfully',
                data: result
            }, 200);
    
        } catch (error) {
            console.error('PlaceBid Error:', error);
            return this.sendError(res, error.message);
        }
    }
    async transferFunds(buyerId, sellerId, amount) {
        try {
            // Get Buyer Wallet Balance
            const buyerWallet = await this.WallateModel
                .select('closing')
                .where('user_id', buyerId)
                orderBy('id', 'DESC')
    .limit(1)
    .getResult();
    
            if (!buyerWallet || !buyerWallet.closing) {
                throw new Error('Buyer has no wallet balance!');
            }
    
            const buyerBalance = parseFloat(buyerWallet.closing);
    
            if (buyerBalance < amount) {
                throw new Error('Insufficient balance!');
            }
    
            // Deduct money from buyer
            const newBuyerBalance = buyerBalance - amount;
            await this.WallateModel.insert({
                user_id: buyerId,
                opening: buyerBalance,
                amount: -amount,
                closing: newBuyerBalance,
                status: 'completed',
                gateway: 'internal_transfer',
                created_at: new Date()
            });
    
            // Get Seller's Wallet Balance
            const sellerWallet = await this.WallateModel
                .select('closing')
                .where('user_id', sellerId)
                orderBy('id', 'DESC')
                .limit(1)
                .getResult();
            const sellerBalance = sellerWallet && sellerWallet.closing ? parseFloat(sellerWallet.closing) : 0;
            const newSellerBalance = sellerBalance + amount;
    
            // Credit money to seller
            await this.WallateModel.insert({
                user_id: sellerId,
                opening: sellerBalance,
                amount: amount,
                closing: newSellerBalance,
                status: 'completed',
                gateway: 'internal_transfer',
                created_at: new Date()
            });
    
            return { success: true, message: 'Transaction successful!' };
    
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    // Helper method for creating bid records
    
}
module.exports = Crop
