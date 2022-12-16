const dbConfig = require('../dbConfig.json');

const {Sequelize, DataTypes, Op} = require('sequelize');

const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
    host: dbConfig.host,
    dialect: 'mariadb',
    logging: false
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.board = require('./board')(sequelize,Sequelize);

module.exports = db;

