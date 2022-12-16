const {DataTypes} = require('sequelize');

module.exports = (sequelize, Sequelize) => {
    const board = sequelize.define('board', {
        subject: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        content: {
            type: DataTypes.STRING(2000),
            allowNull: false,
        },
        writer: {
            type: DataTypes.STRING(30),
            allowNull: false
        },
        video_path: {
            type: DataTypes.CHAR(14),
            allowNull: false
        },
        video_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        reg_date: {
            type: DataTypes.DATE
        }
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci',
        timestamps: false
    });
    return board;
};