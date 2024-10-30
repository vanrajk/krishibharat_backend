const BaseModel = require('../system/BaseModel')


class KycModel extends BaseModel {
    constructor() {
        super('kyc');
        this.allowedFields = ['id', 'user_id', 'doc_type','created_at'];
    }

}
module.exports = KycModel;
