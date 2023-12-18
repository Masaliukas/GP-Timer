"use strict"
const {ChangeStream}        = require('../database/change_stream');
const {ScheduleEventsModel} = require('../database/collections/scheduled_events');
const Scheduler             = require('../scheduler/scheduler');


let EVENT_DATA


function onInsert(data) {
    if(EVENT_DATA === null){
        global.PROCESS_ID ++
        Scheduler(null)
        return
    }

    if(
        EVENT_DATA.event_number === data.event_number &&
        EVENT_DATA.time.start > data.time.start
    ) {
        global.PROCESS_ID ++
        Scheduler(null)
    }
}

function onUpdate(data) {
    if(EVENT_DATA === null){
        global.PROCESS_ID ++
        Scheduler(null)
        return
    }

    if(EVENT_DATA.event_id === data.event_id){
        if(
            EVENT_DATA.time.start !== data.time.start ||
            EVENT_DATA.time.end !== data.time.end ||
            data.session.canceled
        ) {
            console.log('new Process id')
            global.PROCESS_ID ++
            Scheduler(null)
        }
    } else if(
        EVENT_DATA.event_number >= data.event_number &&
        EVENT_DATA.time.start > data.time.start
    ){
        global.PROCESS_ID ++
        Scheduler(null)
    }
}

function onDelete(documentID) {
    if(EVENT_DATA === null){
        return
    }

    if(EVENT_DATA._id === documentID){
        global.PROCESS_ID ++
        Scheduler(null)
    }
}


function onChange(change) {
    if (change.method === DATABASE_ACTIONS.insert) {
        onInsert(change.data)
    } else if (change.method === DATABASE_ACTIONS.update || change.method === DATABASE_ACTIONS.replace) {
        onUpdate(change.data)
    } else if (change.method === DATABASE_ACTIONS.delete) {
        onDelete(change.doc_id)
    }
}

function onError() {
    new Promise(async () => {
        LOGGER.info('closing client')

        try {
            await CLIENT.destroy()
        } catch (e) {
            LOGGER.error(e)
        }

        LOGGER.info('client stopped')
        process.exit(0)
    })
}



exports.ScheduledEventListener = {
    start   : () => {
        ChangeStream(ScheduleEventsModel, {session: global.DATA_DB_SESSION, fullDocument: "updateLookup"}, onChange, onError)
    },
    update  : (eventData) => {
        EVENT_DATA = eventData
    },
    stop    : function () {
        //TODO
    }
}