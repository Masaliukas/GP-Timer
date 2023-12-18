"use strict"
const {ChangeStream}            = require('../database/change_stream');
const {ScheduleSessionsModel}   = require('../database/collections/scheduled_sessions');
const Scheduler                 = require('../scheduler/scheduler');


let SESSION_DATA


function onInsert(data) {
    if(SESSION_DATA === null){
        global.PROCESS_ID ++
        Scheduler(null)
        return
    }

    if(
        SESSION_DATA.event_id === data.event_id &&
        data.concluded === false
    ) {
        global.PROCESS_ID ++
        Scheduler(null)
    }
}

function onUpdate(data) {
    if(SESSION_DATA === null){
        global.PROCESS_ID ++
        Scheduler(null)
        return
    }

    if(SESSION_DATA._id === data._id){
        if(SESSION_DATA.start_time !== data.start_time && SESSION_DATA.duration !== data.duration){
            global.PROCESS_ID ++
            Scheduler(null)
        }
    } else if(
        SESSION_DATA.event_id === data.event_id &&
        data.concluded === false
    ){
        global.PROCESS_ID ++
        Scheduler(null)
    }
}

function onDelete(documentID) {
    if(SESSION_DATA === null){
        return
    }

    if(SESSION_DATA._id === documentID){
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



exports.ScheduledSessionsListener = {
    start   : () => {
        ChangeStream(ScheduleSessionsModel, {session: global.DATA_DB_SESSION, fullDocument: "updateLookup"}, onChange, onError)
    },
    update  : (sessionData) => {
        SESSION_DATA = sessionData
    },
    stop    : function () {
        //TODO
    }
}