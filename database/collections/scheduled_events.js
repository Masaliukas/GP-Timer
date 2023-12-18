const
    mongoose                = require('mongoose'),
    {DataDatabase}          = require('../connection'),
    { DBResponseHandler }   = require('../database_call_middleware');


const COLLECTION_NAME = 'schedule_events'


const schema = new mongoose.Schema({
    event_id    : {type: String,    required: true, unique: true},
    reference_id: {type: String,    required: true},
    season      : {type: Number,    required: true},
    time        : {
        start   : {type: Date,  required: true},
        end     : {type: Date,  required: true},
    },
    circuit     : {
        circuit_id  : {type: String,    required: true},
        layout_id   : {type: String,    required: true},
        name        : {type: String,    required: true}
    },
    country     : {
        iso     : {type: String,    required: true},
        name    : {type: String,    required: true}
    },
    event_type  : {type: String,    required: true},
    event_number: {type: Number,    required: true},
    title       : {type: String,    required: true},
    canceled    : {type: Boolean,   required: true},
    concluded   : {type: Boolean,   required: true},
    about       : {type: String,    default : null},
    updated_at  : {type: Date,      default : Date.now},
    created_at  : {type: Date,      default : Date.now}
})


const ScheduleEventsModel = DataDatabase.model(COLLECTION_NAME, schema, COLLECTION_NAME);


exports.ScheduleEventsModel = ScheduleEventsModel;

exports.ScheduleEventsActions = {
    find                        : DBResponseHandler(async (query) => {
        return ScheduleEventsModel.find(query)
    }),
    findOne                     : DBResponseHandler(async (query) => {
        return ScheduleEventsModel.findOne(query)
    }),
    findCurrentOrUpcomingRound  : DBResponseHandler(async (query) => {
        return ScheduleEventsModel.findOne(query, null, {sort: {season: 1, event_number: 1}})
    })
}