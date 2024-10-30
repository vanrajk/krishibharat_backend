const BaseModel = require('../system/BaseModel')
const bcrypt =  require('bcrypt');
// cropsmodel.js
class TransectionModel extends BaseModel {
    constructor() {
        super('transection');
        this.allowedFields = ['id', 'from', 'to', 'opening', 'amount', 'closing', 'type', 'timestmp', 'status'];
      
    }

    
}
module.exports = TransectionModel;

