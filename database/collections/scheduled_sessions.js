const
    mongoose                = require('mongoose'),
    {DataDatabase}          = require('../connection'),
    { DBResponseHandler }   = require('../database_call_middleware');


const COLLECTION_NAME = 'schedule_sessions'


const schema = new mongoose.Schema({
    session_id  : {type: String,    required: true, unique: true},
    event_id    : {type: String,    required: true},
    day         : {type: Number,    required: true},
    start_time  : {type: Date,      required: true, unique: true},
    duration    : {type: Number,    required: true},
    category    : {
        id          : {type: Number,    required: true},
        reference_id: {type: String,    required: true},
        name        : {type: String,    required: true}
    },
    session     : {
        id      : {type: Number,    required: true},
        numeral : {type: Number,    required: true},
        name    : {type: String,    required: true}
    },
    canceled    : {type: Boolean,   required: true},
    concluded   : {type: Boolean,   required: true},
    updated_at  : {type: Date,      default : Date.now},
    created_at  : {type: Date,      default : Date.now}
})


const ScheduleSessionsModel = DataDatabase.model(COLLECTION_NAME, schema, COLLECTION_NAME);

exports.ScheduleSessionsModel = ScheduleSessionsModel


exports.ScheduleSessionsActions = {
    find    : DBResponseHandler(async (query) => {
        return ScheduleSessionsModel.find(query, null, {sort: {start_time: 1}})
    }),
    findOne : DBResponseHandler(async (query) => {
        return ScheduleSessionsModel.findOne(query)
    })
}