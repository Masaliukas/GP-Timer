const { EmbedBuilder }              = require('discord.js');
const { CircuitsActions }           = require('../database/collections/circuits');
const { CircuitsLayoutsActions }    = require('../database/collections/circuits_layouts');
const Sleep                         = require('../helpers/sleep');


async function circuit(eventData){
    const circuit = await CircuitsActions.findOne({circuit_id: eventData.circuit.circuit_id})

    if(circuit.error){
        throw new Error('database error')
    }

    return circuit.response
}

async function circuitLayout(eventData){
    const circuitLayout = await CircuitsLayoutsActions.findOne({layout_id: eventData.circuit.layout_id})

    if(circuitLayout.error){
        throw new Error('database error')
    }

    return circuitLayout.response
}


function sessionName(session) {
    let name = ""

    if(session.id === 1){
        if(session.numeral === 1 || session.numeral === 2){
            name += ` r${session.numeral}`
        } else {
            name += "rac"
        }
    } else if(session.id === 2){
        name += ` q${session.numeral}`
    } else if(session.id === 3){
        name += " fp"
    } else if(session.id === 4){
        name += "wup"
    } else if(session.id === 5){
        name += " ep"
    } else if(session.id === 6){
        name += "spr"
    } else if(session.id === 7){
        name += ` p${session.numeral}`
    }

    return name
}

function categoryName(category) {
    return `${category.name}${category.name.length < 6? " " : ""}`
}

function upcomingOrLive(sessionData) {
    const endTime = new Date(sessionData.start_time);
    endTime.setMinutes(endTime.getMinutes() + sessionData.duration);

    return endTime > Date.now()
}

function sessionTimestamps(sessionData){
    const startTimestamp = String(Date.parse(sessionData.start_time)).slice(0, -3)

    if(APP_PARAMS.race_sessions_ids.includes(sessionData.session.id)){
        return `<t:${startTimestamp}:t> <t:${startTimestamp}:R>`
    } else {
        const endTime = new Date(sessionData.start_time);
        endTime.setMinutes(endTime.getMinutes() + sessionData.duration);

        return `<t:${startTimestamp}:t>-<t:${String(Date.parse(endTime)).slice(0, -3)}:t> <t:${startTimestamp}:R>`
    }
}

function schedule(embed, sessionsArray){
    for(const sessionDay of sessionsArray){
        let fields = ""

        for(const daySession of sessionDay){
            const endTime = new Date(daySession.start_time);
            endTime.setMinutes(endTime.getMinutes() + daySession.duration);

            if(daySession.start_time < Date.now() && endTime > Date.now()){
                fields += `\`${categoryName(daySession.category)} ${sessionName(daySession.session)}:\` :green_circle: **LIVE**\n`
            } else {
                fields += `\`${categoryName(daySession.category)} ${sessionName(daySession.session)}:\` ${sessionTimestamps(daySession)}\n`
            }
        }

        if(fields !== ""){
            embed.addFields({name: `<t:${String(Date.parse(sessionDay[0].start_time)).slice(0, -3)}:D>`, value: fields, inline: false})
        }
    }
}

function header(eventData) {
    return `**${eventData.event_number} - ${eventData.title}**\n**${eventData.country.name}** :flag_${eventData.country.iso.toLowerCase()}:\n\n`
}

function circuitPartialMessage(circuit, layout){
    return `**Circuit - ${circuit.name}**\n` +
        `Length: **${layout.length} m.**\n` +
        `Width: **${layout.width}** m.\n` +
        `Straight: **${layout.straight}** m.\n` +
        `Turns: **${layout.turns.total}** (left: **${layout.turns.left}**, right: **${layout.turns.right}**)\n` +
        `Official Circuit Website: **${circuit.website}**`
}


async function editMessage(embed, processID_Local){
    let retryAmount = APP_PARAMS.retry_amount

    if(typeof retryAmount !== 'number' || retryAmount < 0){
        throw new Error(`invalid params, value retry_amount "${retryAmount}" must be more than 0 and be Number`)
    }

    while(retryAmount-- > 0){
        if(PROCESS_ID !== processID_Local){
            return
        }

        try{
            const guildData     = await CLIENT.guilds.cache.get(APP_PARAMS.server_id)
            const channelData   = await guildData.channels.cache.get(APP_PARAMS.channel_id)
            const messageData   = await channelData.messages.fetch(APP_PARAMS.message_id)

            await messageData.edit({embeds: [embed]})
            return
        } catch (e) {
            LOGGER.warn(e)

            if(retryAmount > 0){
                await Sleep(60000)
            } else {
                throw e
            }

        }
    }
}


exports.EventSchedule = async (eventData, eventSessions, processID_Local) => {
    const
        circuitData         = await circuit(eventData),
        circuitLayoutData   = await circuitLayout(eventData)

    const sessionsArray = []

    for(const sessionData of Object.values(eventSessions)){
        if(upcomingOrLive(sessionData)){
            if(sessionsArray.length === 0){
                sessionsArray.push([sessionData])
            } else if(sessionsArray[sessionsArray.length - 1][0].day === sessionData.day){
                sessionsArray[sessionsArray.length - 1].push(sessionData)
            } else {
                sessionsArray.push([sessionData])
            }
        }
    }

    const embed = new EmbedBuilder()
        .setDescription(`${header(eventData)}${circuitPartialMessage(circuitData, circuitLayoutData)}`)

    schedule(embed, sessionsArray)
    await editMessage(embed, processID_Local)
}