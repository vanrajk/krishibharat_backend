const BaseModel = require('../system/BaseModel')


class BankModel extends BaseModel {
    constructor() {
        super('user_bank');
        this.allowedFields = ['id', 'user_id', 'ac_no','ac_name','ifsc','branch_name'];
    }

}
module.exports = BankModel;
