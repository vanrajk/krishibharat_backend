const BaseModel = require('../system/BaseModel')

class AuctionModel extends BaseModel {
    constructor() {
        super('auctions');
        this.allowedFields = ['id', 'crop_id', 'start_time', 'end_time', 'status'];
    }

    async createAuction(crop_id, start_time, end_time) {
        return this.db.query('INSERT INTO auctions (crop_id, start_time, end_time) VALUES (?, ?, ?)', [crop_id, start_time, end_time]);
    }

    async getActiveAuctions() {
        return this.db.query('SELECT * FROM auctions WHERE status = "active"');
    }
}
module.exports = AuctionModel;
