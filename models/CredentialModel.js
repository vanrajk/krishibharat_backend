
const BaseModel = require('../system/BaseModel')
const bcrypt =  require('bcrypt');
class CredentialModel extends BaseModel{
    constructor() {
        super('credential');
        this.allowedFields = ['phone', 'email', 'password','user_id'];
        this.validationRules = {
            email: [
                { validate: (value) => value && value.includes('@'), message: 'Invalid email' },
            ],
            password: [
                { validate: (value) => value && value.length >= 8, message: 'Password must be at least 8 characters' },
            ],
        };
    }

    async beforeInsert(data) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
    }

    async beforeUpdate(data) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
    }



}

module.exports = CredentialModel;