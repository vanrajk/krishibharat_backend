require('dotenv').config({path : `${process.cwd()}/.env`})
const database = {
        host: process.env.HOST,
        user: process.env.DB_USERNAME, 
        password: process.env.DB_PASSWORD, 
        database: process.env.DATABASE
}

const SECRET_KEYS = {
    JWT_SECRET: process.env.JWT_SECRET
}

module.exports= {
    database,
    SECRET_KEYS
}