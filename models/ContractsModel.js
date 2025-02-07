const BaseModel = require('../system/BaseModel');

class ContractsModel extends BaseModel {
    constructor() {
        super('contracts');
        this.allowedFields = ['id', 'crop_id', 'buyer_id', 'seller_id', 'status', 'timestmp'];
    }

    async createContract(data) {
        return await this.insert(data);
    }

    async getContractById(id) {
        return await this.where('id', id).getRow();
    }

    async getAllContracts() {
        return await this.getAll();
    }

    async updateContract(id, data) {
        return await this.where('id', id).update(data);
    }
}

module.exports = ContractsModel;