const mongoose = require('mongoose');


exports.DataDatabase = mongoose.createConnection(
    `mongodb://${process.env.DATA_DATABASE_USER}:${process.env.DATA_DATABASE_PASSWORD}@${process.env.DATA_DATABASE_CONNECTION}/${process.env.DATA_DATABASE_COLLECTION}`
);