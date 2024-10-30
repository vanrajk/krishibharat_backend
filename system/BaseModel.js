const pool = require('../database/conn');  // Use the pool

class BaseModel {
    constructor(table) {
        this.table = table;
        this.allowedFields = [];
        this.validationRules = {};
        this.reset();
    }

    reset() {
        this.selectedFields = '*';
        this.whereClause = '';
        this.whereValues = [];
        this.limitValue = null;
        this.offsetValue = null;
        this.orderByClause = '';
    }

    select(fields) {
        if (!fields) {
            this.selectedFields = this.allowedFields.length ? this.allowedFields.join(', ') : '*';
        } else {
            this.selectedFields = Array.isArray(fields) ? fields.join(', ') : fields;
        }
        return this;
    }

    where(condition, value) {
        if (this.whereClause) {
            this.whereClause += ' AND ';
        }
        this.whereClause += `${condition} = ?`;
        if (value !== undefined) {
            this.whereValues.push(value);
        }
        return this;
    }

    whereIn(field, values) {
        if (!Array.isArray(values) || values.length === 0) {
            throw new Error('Values must be a non-empty array.');
        }
        if (this.whereClause) {
            this.whereClause += ' AND ';
        }
        this.whereClause += `${field} IN (${values.map(() => '?').join(', ')})`;
        this.whereValues.push(...values);
        return this;
    }

    limit(value) {
        this.limitValue = value;
        return this;
    }

    offset(value) {
        this.offsetValue = value;
        return this;
    }

    orderBy(field, direction = 'ASC') {
        this.orderByClause = `ORDER BY ${field} ${direction}`;
        return this;
    }

    buildQuery() {
        let selectFields = this.selectedFields === '*' && this.allowedFields.length 
            ? this.allowedFields.join(', ') 
            : this.selectedFields;
        let query = `SELECT ${selectFields} FROM ${this.table}`;
        
        if (this.whereClause) {
            query += ` WHERE ${this.whereClause}`;
        }
        if (this.orderByClause) {
            query += ` ${this.orderByClause}`;
        }
        if (this.limitValue !== null) {
            query += ` LIMIT ?`;
            this.whereValues.push(this.limitValue);
        }
        if (this.offsetValue !== null) {
            query += ` OFFSET ?`;
            this.whereValues.push(this.offsetValue);
        }
        return query;
    }

    get() {
        return new Promise((resolve, reject) => {
            const query = this.buildQuery();
            // Use the pool to get a connection and execute the query
            pool.getConnection((err, connection) => {
                if (err) {
                    reject(err);  // Connection error
                    return;
                }
                
                connection.query(query, this.whereValues, (error, results) => {
                    connection.release();  // Always release the connection back to the pool
                    this.reset();  // Reset query state after execution
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
        });
    }

    count() {
        return new Promise((resolve, reject) => {
            // Build the count query
            let query = `SELECT COUNT(*) AS count FROM ${this.table}`;
            
            if (this.whereClause) {
                query += ` WHERE ${this.whereClause}`;
            }

            // Use the pool to get a connection and execute the query
            pool.getConnection((err, connection) => {
                if (err) {
                    reject(err);  // Connection error
                    return;
                }
                
                connection.query(query, this.whereValues, (error, results) => {
                    connection.release();  // Always release the connection back to the pool
                    this.reset();  // Reset query state after execution
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results[0].count);  // Return the count value
                    }
                });
            });
        });
    }

    getResult() {
        return this.get().then(results => results[0] || null);
    }

    getResultArray() {
        return this.get();
    }

    getRow() {
        return this.limit(1).get().then(results => results[0] ? Object.values(results[0])[0] : null);
    }

    getRowArray() {
        return this.limit(1).get().then(results => results[0] ? Object.values(results[0]) : []);
    }

    find(id) {
        return this.where('id', id).getResult();
    }

    findAll() {
        return this.get();
    }

    insert(data) {
        return new Promise((resolve, reject) => {
            const filteredData = this.filterAllowedFields(data);
            this.validate(filteredData)
                .then(() => this.runCallbacks('beforeInsert', filteredData))
                .then(() => {
                    const query = `INSERT INTO ${this.table} SET ?`;
                    pool.query(query, filteredData, (error, result) => {
                        if (error) reject(error);
                        else {
                            this.runCallbacks('afterInsert', result)
                                .then(() => resolve(result.insertId));
                        }
                    });
                })
                .catch(reject);
        });
    }
    first() {
        return this.limit(1).get().then(results => results[0] || null);
    }
    
    update(data) {
        return new Promise((resolve, reject) => {
            const filteredData = this.filterAllowedFields(data);
            this.validate(filteredData)
                .then(() => this.runCallbacks('beforeUpdate', filteredData))
                .then(() => {
                    let query = `UPDATE ${this.table} SET ?`;

                    if (this.whereClause) {
                        query += ` WHERE ${this.whereClause}`;
                    }

                    pool.query(query, [filteredData, ...this.whereValues], (error) => {
                        this.reset();
                        if (error) reject(error);
                        else {
                            this.runCallbacks('afterUpdate', filteredData)
                                .then(() => resolve());
                        }
                    });
                })
                .catch(reject);
        });
    }

    delete(id) {
        return new Promise((resolve, reject) => {
            this.runCallbacks('beforeDelete', id)
                .then(() => {
                    pool.query(`DELETE FROM ${this.table} WHERE id = ?`, [id], (error) => {
                        if (error) reject(error);
                        else {
                            this.runCallbacks('afterDelete', id)
                                .then(() => resolve());
                        }
                    });
                })
                .catch(reject);
        });
    }

    filterAllowedFields(data) {
        return Object.keys(data)
            .filter(key => this.allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = data[key];
                return obj;
            }, {});
    }

    validate(data) {
        return new Promise((resolve, reject) => {
            for (const [field, rules] of Object.entries(this.validationRules)) {
                for (const rule of rules) {
                    if (!rule.validate(data[field])) {
                        reject(new Error(`Validation failed for ${field}: ${rule.message}`));
                        return;
                    }
                }
            }
            resolve();
        });
    }

    runCallbacks(type, data) {
        return new Promise((resolve) => {
            if (this[type] && typeof this[type] === 'function') {
                Promise.resolve(this[type](data)).then(resolve);
            } else {
                resolve();
            }
        });
    }
}

module.exports = BaseModel;
