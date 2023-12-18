const {ScheduleEventsActions}       = require('../database/collections/scheduled_events');
const {ScheduleSessionsActions}     = require('../database/collections/scheduled_sessions');
const {EventSchedule}               = require('./event_schedule');
const {LiveTiming}                  = require('./live_timing');
const Sleep                         = require('../helpers/sleep');


async function nextCurrentEvent(previous, checkNextSeason) {
    const eventData = await ScheduleEventsActions.findCurrentOrUpcomingRound({
        season      : previous !== null? previous.season : { $gte: new Date().getFullYear()},
        event_number: previous !== null? { $gt: previous.event_number} : 1,
        concluded   : false,
        canceled    : false
    })

    if(eventData.error){
        throw new Error('database error')
    }

    if(!checkNextSeason){
        return null
    }

    if(eventData.response === null && previous === null){
        throw new Error('unable to find current/next event in database')
    }

    if(eventData.response === null && previous !== null){
        return await nextCurrentEvent(null, false)
    }

    return eventData.response
}

async function eventSessions(eventData) {
    const sessionData = await ScheduleSessionsActions.find({
        event_id: eventData.event_id,
        canceled: false
    })

    if(sessionData.error){
        throw new Error('database error')
    }

    if(sessionData.response.length === 0){
        throw new Error('unable to find sessions for event, event MUST have sessions')
    }

    return sessionData.response
}

function sessionNameShort(sessionData) {
    const numeral = sessionData.session.numeral > 0? sessionData.session.numeral : ''

    switch (sessionData.session.id) {
        case 1:
            return `Race${numeral}`
        case 2:
            return `Q${numeral}`
        case 3:
            return `FP${numeral}`
        case 4:
            return `WUP${numeral}`
        case 5:
            return `EP${numeral}`
        case 6:
            return `SPR${numeral}`
        case 7:
            return `P${numeral}`
    }

    return sessionData.session.name
}

function sessionEndTimeHelper(sessionData){
    const endTime = new Date(sessionData.start_time)
    endTime.setMinutes(endTime.getMinutes() + sessionData.duration)

    return endTime
}

async function setUpdateEvent(eventData, sessionsData, sessionData, index, processID_Local){
    await EventSchedule(eventData, sessionsData, processID_Local)

    try{
        if(index === '0'){
            CLIENT.user.setPresence({activities: [{name: `⏳ ${eventData.country.name} 🏍`}], status: 'idle'});
        } else {
            CLIENT.user.setPresence({activities: [{name: `⏳ ${sessionData.category.name} ${sessionNameShort(sessionData)}`}], status: 'idle'});
        }
    } catch (e) {
        LOGGER.warn(e)
    }
}


function scheduler(previous) {
    new Promise(async () => {
        try {
            const processID_Local = PROCESS_ID;
            const eventData = await nextCurrentEvent(previous, true);

            if(eventData === null){
                return
            }

            SCHEDULED_EVENTS_LISTENER.update(eventData)

            const sessionsData = await eventSessions(eventData)

            if(sessionsData.length === 0){
                return
            }

            for(const [index, sessionData] of Object.entries(sessionsData)){
                if(PROCESS_ID !== processID_Local){
                    return
                }

                SCHEDULED_SESSIONS_LISTENER.update(sessionData)

                const sessionEndTime = sessionEndTimeHelper(sessionData)

                if(Date.now() < sessionEndTime){
                    if(Date.now() < sessionData.start_time){
                        await setUpdateEvent(eventData, sessionsData, sessionData, index, processID_Local)

                        if(PROCESS_ID !== processID_Local){
                            return
                        }

                        const sleeps = sessionData.start_time - Date.now()

                        LOGGER.info(`event_number: ${eventData.event_number}\n` +
                            `category_name: ${sessionData.category.name}\n` +
                            `session_name: ${sessionData.session.name}\n` +
                            `sleeps until: ${sessionData.start_time}\n` +
                            `sleep ms: ${sleeps}`)

                        while (sessionData.start_time - Date.now() > 2147483647){
                            await Sleep(2147483647)

                            if(PROCESS_ID !== processID_Local){
                                return
                            }
                        }

                        await Sleep(sessionData.start_time - Date.now())

                        if(PROCESS_ID !== processID_Local){
                            return
                        }
                    }

                    await EventSchedule(eventData, sessionsData, processID_Local)

                    if(PROCESS_ID !== processID_Local){
                        return
                    }

                    try{
                        CLIENT.user.setPresence({activities: [{name: `${sessionData.category.name} ${sessionNameShort(sessionData)}`}]});
                    } catch (e) {
                        LOGGER.warn(e)
                    }

                    await LiveTiming(eventData, sessionData, processID_Local)

                    if(PROCESS_ID !== processID_Local){
                        return
                    }
                }
            }

            scheduler(eventData)
        } catch (e) {
            SCHEDULED_EVENTS_LISTENER.update(null)
            SCHEDULED_SESSIONS_LISTENER.update(null)
            LOGGER.error(e)
            LOGGER.info('closing client')

            try {
                await CLIENT.destroy()
            } catch (e) {
                LOGGER.error(e)
            }

            LOGGER.info('client stopped')
            process.exit(0)
        }
    })
}

module.exports = scheduler