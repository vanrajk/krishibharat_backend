const BaseModel = require('../system/BaseModel')
const bcrypt =  require('bcrypt');
// cropsmodel.js
class WalletModel extends BaseModel {
    constructor() {
        super('wallet');
        this.allowedFields = ['id', 'trn_id', 'user_id', 'opening','amount','closing', 'status','gateway', 'created_at'];
      
    }

    
}
module.exports = WalletModel;

