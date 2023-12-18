const mongoose              = require('mongoose');
const {DataDatabase}        = require('../connection');
const {DBResponseHandler}   = require("../database_call_middleware")


const COLLECTION_NAME = 'circuits_layouts'


const schema = new mongoose.Schema({
    layout_id               : {type: String, required: true, unique: true},
    circuit_id              : {type: String, required: true},
    usage_seasons           : [Number],
    length				    : {type: Number, default: null},
    width				    : {type: Number, default: null},
    straight			    : {type: Number, default: null},
    turns				    : {
        left	: {type: Number, default: null},
        right	: {type: Number, default: null},
        total	: {type: Number, default: null}
    },
    corner_names            : [{
        _id     : false,
        number  : {type: Number, required: true},
        name    : {type: String, default: null}
    }],
    corner_rename_details   : [{
        _id             : false,
        year            : {type: Number, required: true},
        number          : {type: Number, required: true},
        previous_name   : {type: String, required: true},
        new_name        : {type: String, required: true}
    }],
    updated_at              : {type: Date,      default: Date.now},
    created_at              : {type: Date,      default: Date.now}
})


const CircuitLayoutModel = DataDatabase.model(COLLECTION_NAME, schema, COLLECTION_NAME);


exports.CircuitsLayoutsActions = {
    findOne     : DBResponseHandler(async (query, session)  => {
        return CircuitLayoutModel.findOne(query, null, session? { session: session } : {})
    }),
    updateOne   : DBResponseHandler(async (query, update, session)  => {
        return CircuitLayoutModel.updateOne(query, update, { session: session })
    }),
    createOne   : DBResponseHandler(async (data, session)   => {
        return CircuitLayoutModel.create([data], { session: session })
    })
}