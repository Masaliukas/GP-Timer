const mongoose              = require('mongoose');
const {DataDatabase}        = require('../connection');
const {DBResponseHandler}   = require("../database_call_middleware")


const COLLECTION_NAME = 'circuits';


const schema = new mongoose.Schema({
    circuit_id	    : {type: String,    required: true, unique: true},
    name            : {type: String,    required: true},
    name_history    : [{
        _id     : false,
        seasons : [Number],
        name    : {type: String, required: true}
    }],
    country         : {
        iso : {type: String, required: true},
        name: {type: String, required: true},
    },
    usage_seasons   : [Number],
    location        : {type: String,    default: null},
    geo_location    : {
        longitude   : {type: String, default: null},
        latitude    : {type: String, default: null},
    },
    website         : {type: String,    default: null},
    about           : [{
        text    : {type: String,    default: null},
        source  : {type: String,    default: null}
    }],
    updated_at      : {type: Date,      default: Date.now},
    created_at      : {type: Date,      default: Date.now}
})


const CircuitModel = DataDatabase.model(COLLECTION_NAME, schema, COLLECTION_NAME);


exports.CircuitsActions = {
    findOne     : DBResponseHandler(async (query, session)  => {
        return CircuitModel.findOne(query, null, session? { session: session } : {})
    }),
    updateOne   : DBResponseHandler(async (query, update, session)  => {
        return CircuitModel.updateOne(query, update, { session: session })
    }),
    createOne   : DBResponseHandler(async (data, session)   => {
        return CircuitModel.create([data], { session: session })
    })
}