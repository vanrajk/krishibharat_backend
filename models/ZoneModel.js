const BaseModel = require('../system/BaseModel')


class ZoneModel extends BaseModel {
    constructor() {
        super('zones');
        this.allowedFields = ['id', 'name', 'state'];
    }

}
module.exports = ZoneModel;
