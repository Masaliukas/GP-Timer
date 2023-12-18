const Sleep = require('../helpers/sleep');


function longestClassifiedName(ridersData){
    let nameLength = 0

    for(const rider of Object.values(ridersData)){
        const lengthName = rider.rider_name.length + rider.rider_surname.length

        if(rider.status_id === '1' && lengthName > nameLength){
            nameLength = lengthName
        }
    }

    return nameLength
}

function riderPositionHandler(position) {
    return `${position < 10? " ": "" }${position}`
}

function riderNumberHandler(riderNumber){
    return `${riderNumber < 10? " ": "" }${riderNumber}`
}

function riderNameHandler(longestNameLength, rider){
    const lengthName = rider.rider_name.length + rider.rider_surname.length

    if(longestNameLength > lengthName){
        const difference = longestNameLength - lengthName

        return `${rider.rider_name} ${rider.rider_surname}${" ".repeat(difference)}`
    } else {
        return `${rider.rider_name} ${rider.rider_surname}`
    }
}

function riderGapHandler(timeLength, rider){
    if(timeLength > rider.gap_first.length){
        const difference = timeLength - rider.gap_first.length

        return `${" ".repeat(difference)}${rider.gap_first}`
    } else {
        return rider.gap_first
    }
}


function headerShared(isRace, ltSessionData){
    let header = `Category: **${ltSessionData.category}**\nSession: **${ltSessionData.session_name}**\n`

    if(ltSessionData.session_status_name === 'F'){
        header += 'Status: :checkered_flag:'
        return header
    }

    if(ltSessionData.session_status_name === 'I'){
        header += 'Status: :red_square:\n'
    }

    if(isRace){
        header += `Remaining Laps: **${ltSessionData.remaining}**`
    } else {
        const
            remaining   = ltSessionData.remaining,
            minutes     = Math.floor(remaining / 60),
            seconds     = remaining - (minutes * 60)

        header += `Time Left: **${minutes}:${seconds < 10? "0": ""}${seconds}**`
    }

    return header
}

function tableHeader(isRace, classifiedLongest, timeLength) {
    let header = `pos | nr Rider Name${" ".repeat(classifiedLongest - 9)} | `

    if(isRace){
        header += 'time/gap'
    } else {
        header += 'lap/gap'
    }

    header += `\n${"-".repeat(classifiedLongest + timeLength + 13)}\n`

    return header
}


function ltRaceMessageHandler(sessionData, ltData){
    const ltSessionData = ltData.head;
    const ltRiders      = ltData.rider;

    if(ltSessionData === undefined || ltRiders === undefined){
        return '`Live Timing Not Available atm.`'
    }

    let message     = headerShared(true, ltSessionData);
    let inRace      = ''
    let outRace     = ''
    let entry       = ''

    if(Object.keys(ltRiders).length === 0){
        return message
    }

    if(ltSessionData.session_status_name === 'N'){
        for(const riderData of Object.values(ltRiders)){
            entry += `${riderNumberHandler(riderData.rider_number)} ${riderData.rider_name} ${riderData.rider_surname}\n`
        }
    } else {
        const classifiedLongest = longestClassifiedName(ltRiders)
        const timeLength        = ltRiders['1'].lap_time.length //TODO: check if not null

        inRace += tableHeader(true, classifiedLongest, timeLength)

        for(const [key, riderData] of Object.entries(ltRiders)){
            if(key === '1'){
                inRace += ` ${riderPositionHandler(riderData.pos)} | ${riderNumberHandler(riderData.rider_number)} ${riderNameHandler(classifiedLongest, riderData)} | ${riderData.lap_time} ${riderData.on_pit}\n`
            } else if(riderData.status_name === 'RT' || riderData.status_name === 'N1'){
                outRace += `DNF | ${riderNumberHandler(riderData.rider_number)} ${riderData.rider_name} ${riderData.rider_surname}\n`
            } else if(riderData.status_name === 'NS'){
                outRace += `DNS | ${riderNumberHandler(riderData.rider_number)} ${riderData.rider_name} ${riderData.rider_surname}\n`
            } else {
                inRace += ` ${riderPositionHandler(riderData.pos)} | ${riderNumberHandler(riderData.rider_number)} ${riderNameHandler(classifiedLongest, riderData)} | ${riderGapHandler(timeLength, riderData)} ${riderData.on_pit}\n`
            }
        }
    }

    if(entry !== ''){
        message += `\`\`\`\n${entry}\`\`\``
    }

    if(inRace !== ''){
        message += `\`\`\`\n${inRace}\`\`\``
    }

    if(outRace !== ''){
        message += `\n\`\`\`\n${outRace}\`\`\``
    }

    return message
}

function ltSessionMessageHandler(sessionData, ltData){
    const ltSessionData = ltData.head;
    const ltRiders      = ltData.rider;

    if(ltSessionData === undefined || ltRiders === undefined){
        return '`Live Timing Not Available atm.`'
    }

    let message = headerShared(false, ltSessionData);

    let entry       = ''
    let classified  = ''
    let noTimeSet   = ''

    if(Object.keys(ltRiders).length === 0){
        return message
    }

    if(ltSessionData.session_status_name === 'N'){
        for(const riderData of Object.values(ltRiders)){
            entry += `${riderNumberHandler(riderData.rider_number)} ${riderData.rider_name} ${riderData.rider_surname}\n`
        }
    }
    else {
        const classifiedLongest = longestClassifiedName(ltRiders)
        const timeLength        = ltRiders['1'].lap_time.length //TODO: check if not null

        if(classifiedLongest === 0){
            for(const riderData of Object.values(ltRiders)){
                noTimeSet += `${riderNumberHandler(riderData.rider_number)} ${riderData.rider_name} ${riderData.rider_surname}\n`
            }
        } else {
            classified += tableHeader(false, classifiedLongest, timeLength)

            for(const [key, riderData] of Object.entries(ltRiders)){
                if(key === '1'){
                    classified += ` ${riderPositionHandler(riderData.pos)} | ${riderNumberHandler(riderData.rider_number)} ${riderNameHandler(classifiedLongest, riderData)} | ${riderData.lap_time} ${riderData.on_pit}\n`
                } else if(riderData.status_id === '1'){
                    classified += ` ${riderPositionHandler(riderData.pos)} | ${riderNumberHandler(riderData.rider_number)} ${riderNameHandler(classifiedLongest, riderData)} | ${riderGapHandler(timeLength, riderData)} ${riderData.on_pit}\n`
                } else if(riderData.status_name === 'NC'){
                    noTimeSet += `${riderNumberHandler(riderData.rider_number)} ${riderData.rider_name} ${riderData.rider_surname}\n`
                }
            }
        }
    }

    if(entry !== ''){
        message += `\`\`\`\n${entry}\`\`\``
    }

    if(classified !== ''){
        message += `\`\`\`\n${classified}\`\`\``
    }

    if(noTimeSet !== ''){
        message += `\n*NO TIME SET*\n\`\`\`\n${noTimeSet}\`\`\``
    }

    return message
}


function ltEndTimeHelper(sessionData){
    const endTime = new Date(sessionData.start_time)

    if(APP_PARAMS.race_sessions_ids.includes(sessionData.session.id)){
        endTime.setMinutes(endTime.getMinutes() + sessionData.duration)
    } else {
        endTime.setMinutes(endTime.getMinutes() + sessionData.duration + 7)
    }

    return endTime
}


async function fetchLT(){
    try{
        const response = await fetch(APP_PARAMS.data_request_url)

        return await response.json()
    } catch (e) {
        LOGGER.warn(e)
        return null
    }
}


exports.LiveTiming = async (eventData, eventSession, processID_Local) => {
    const ltEndTime = ltEndTimeHelper(eventSession);

    let guildData, channelData, fetchedMessages, lastMessage;

    let retryAmount = APP_PARAMS.retry_amount

    if(typeof retryAmount !== 'number' || retryAmount < 0){
        throw new Error(`invalid params, value retry_amount "${retryAmount}" must be more than 0 and be Number`)
    }

    while(retryAmount-- > 0){
        try{
            guildData       = await CLIENT.guilds.cache.get(APP_PARAMS.server_id);
            channelData     = await guildData.channels.cache.get(APP_PARAMS.channel_id);
            fetchedMessages = await channelData.messages.fetch({limit: 1});
            lastMessage     = fetchedMessages.last();

            retryAmount = 0
        } catch (e) {
            LOGGER.warn(e)

            if(retryAmount > 0){
                await Sleep(30000)
            } else {
                throw e
            }

        }
    }

    let ltMessage = null

    if(lastMessage?.id !== APP_PARAMS.message_id && lastMessage?.author.id === CLIENT_ID){
        ltMessage = lastMessage
    }

    while(ltEndTime > Date.now()){
        if(PROCESS_ID !== processID_Local){
            return
        }

        const ltData = await fetchLT()

        let messageContent = '`Live Timing Not Available atm.`';

        if(ltData !== null){
            if(APP_PARAMS.race_sessions_ids.includes(eventSession.session.id)){
                messageContent = ltRaceMessageHandler(eventSession, ltData)
            } else {
                messageContent = ltSessionMessageHandler(eventSession,ltData)
            }
        }


        try{
            if(ltMessage !== null){
                await ltMessage.edit(messageContent)
            } else {
                ltMessage = await channelData.send(messageContent)
            }
        } catch (e) {
            LOGGER.warn(e)
        }

        await Sleep(APP_PARAMS.wait_between_request)
    }

    if(ltMessage !== null){
        let retryDelete = APP_PARAMS.retry_amount

        while(retryDelete-- > 0){
            if(PROCESS_ID !== processID_Local){
                return
            }
            try{
                await channelData.messages.delete(ltMessage.id)

                return
            } catch (e) {
                LOGGER.warn(e)

                if(retryDelete > 0){
                    await Sleep(30000)
                } else {
                    throw e
                }

            }
        }

    }
}