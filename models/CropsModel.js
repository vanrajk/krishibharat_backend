const BaseModel = require('../system/BaseModel')
const bcrypt =  require('bcrypt');
// cropsmodel.js
class CropsModel extends BaseModel {
    constructor() {
        super('crops');
        this.allowedFields = ['id', 'seller_id', 'buyer_id', 'name', 'bag', 'qty', 'base_price', 'trigger_price', 'sold_price', 'created_at', 'sold_at', 'zone_id'];
      
    }

    
}
module.exports = CropsModel;

