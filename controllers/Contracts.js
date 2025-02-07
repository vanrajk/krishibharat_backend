const BaseModel = require('../system/BaseModel');
const BaseController = require('../system/BaseController');
const ContractsModel = require('../models/ContractsModel');
const CropModel = require('../models/CropsModel');
const jwt = require('jsonwebtoken');
const SECRET_KEYS = require('../config/config').SECRET_KEYS;

class Contracts extends BaseController {
    constructor() {
        super();
        this.contractsModel = new ContractsModel();
        this.cropModel = new CropModel();
    }

    async createContract(req, res) {
        try {
            const { token, crop_id, buyer_id, seller_id, status } = req.body;
            let decoded;
            try {
                decoded = jwt.verify(token, SECRET_KEYS.JWT_SECRET);
            } catch (err) {
                return res.status(401).json({ message: 'Invalid or expired token' });
            }

            const contractId = await this.contractsModel.insert({ crop_id, buyer_id, seller_id, status });
            if (contractId > 0) {
                this.sendResponse(res, { contractId, message: 'Contract created successfully' }, 201);
            } else {
                this.sendError(res, { message: 'Failed to create contract' }, 500);
            }
        } catch (error) {
            this.sendError(res, error.message);
        }
    }

    async list(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Authorization token missing or invalid!!!' });
            }
    
            const token = authHeader.split(' ')[1];
    
            let decoded;
            try {
                decoded = jwt.verify(token, SECRET_KEYS.JWT_SECRET);
            } catch (err) {
                return res.status(401).json({ message: 'Invalid or expired token' + err });
            }
    
            const buyer_id = decoded.userId;
    
            // Fetch contracts for the buyer
            let contracts = await this.contractsModel.where('buyer_id', buyer_id).getResultArray();
    
            // Fetch crop details for each contract
            for (let contract of contracts) {
                if (contract.crop_id) {
                    const crop = await this.cropModel.where('id', contract.crop_id).getResult();
                    if (crop) {
                        contract.crop_name = crop.name;
                        contract.sold_price = crop.sold_price;
                        contract.bag = crop.bag;
                    }
                }
            }
    
            this.sendResponse(res, contracts, 200);
        } catch (error) {
            this.sendError(res, error.message);
        }
    }
    
    
    async updateContract(req, res) {
        try {
            const {id,status} = req.body;
            const updatedData = {
                status
            }
            const update = await this.contractsModel.where('id', id).update(updatedData);
            return this.sendResponse(res, update, 200);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }

    async getContractById(req, res) {
        try {
            const { id } = req.params;
            const contract = await this.contractsModel.where('id', id).getRow();
    
            if (!contract) {
                return this.sendError(res, "Contract not found", 404);
            }
    
            // Fetch crop details
            const crop = await this.cropModel.where('id', contract.crop_id).getRow();
    
            if (crop) {
                contract.crop_name = crop.name;
                contract.sold_price = crop.sold_price;
                contract.bag = crop.bag;
            }
    
            return this.sendResponse(res, contract, 200);
        } catch (error) {
            return this.sendError(res, error.message);
        }
    }
    
}

module.exports = Contracts;
