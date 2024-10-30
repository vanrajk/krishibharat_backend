const BaseModel = require('../system/BaseModel')
const bcrypt =  require('bcrypt');
class UserModel extends BaseModel{
    constructor() {
        super('users');
        this.allowedFields = ['id','user_type', 'title', 'fname', 'mname', 'lname', 'gender', 'dob', 'nomini_type', 'nomini_name', 'address', 'pincode', 'state', 'district', 'village', 'lic_no', 'created_by', 'created_at', 'modified_at','completion_status'];

        this.validationRules = {
         
            title: [
                { validate: (value) => value !== null && value !== undefined && value !== '', message: 'Title is required' },
            ],
            fname: [
                { validate: (value) => value !== null && value !== undefined && value !== '', message: 'First name is required' },
            ],
            mname: [
                { validate: (value) => value !== null && value !== undefined && value !== '', message: 'Middle name is required' },
            ],
            lname: [
                { validate: (value) => value !== null && value !== undefined && value !== '', message: 'Last name is required' },
            ],
            dob: [
                { validate: (value) => value !== null && value !== undefined && value !== '', message: 'Date of birth is required' },
            ]
          
         
                    }}
                

   



}

module.exports = UserModel;