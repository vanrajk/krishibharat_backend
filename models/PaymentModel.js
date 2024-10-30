const BaseModel = require('../system/BaseModel')
const bcrypt =  require('bcrypt');
// cropsmodel.js
class PaymentModel extends BaseModel {
    constructor() {
        super('payment');
        this.allowedFields = ['id', 'order_id','trn_id', 'user_id', 'amount', 'status','gateway', 'created_at'];
      
    }

    
}
module.exports = PaymentModel;

