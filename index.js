require('./core/globals');

const {DataDatabaseSession}         = require('./database/session.js');
const {ScheduledEventListener}      = require('./listeners/schedule_event');
const {ScheduledSessionsListener}   = require('./listeners/schedule_sessions');
const Scheduler                     = require('./scheduler/scheduler');

global.SCHEDULED_EVENTS_LISTENER    = ScheduledEventListener
global.SCHEDULED_SESSIONS_LISTENER  = ScheduledSessionsListener


CLIENT.on('ready', async () => {
    try{
        LOGGER.info('app ready')
        global.DATA_DB_SESSION = await DataDatabaseSession.start()

        SCHEDULED_EVENTS_LISTENER.start()
        SCHEDULED_SESSIONS_LISTENER.start()
        Scheduler(null)
    } catch (e) {
        LOGGER.error(e)
    }
});

CLIENT.on('error', async (e) => {
    LOGGER.error(e)
});


(async function () {
    try{
        LOGGER.info('app starting')

        await CLIENT.login(process.env.APP_TOKEN)
    } catch (e) {
        console.log(e)
    }
})()