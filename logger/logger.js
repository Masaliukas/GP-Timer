const {createLogger, transports, format } = require('winston')

const {combine, timestamp, printf} = format;

require('winston-daily-rotate-file');

const LOGGING_LEVEL = process.env.LOGGING_LEVEL || "info";



const logFormat = printf(e => {
    return `${e.timestamp} [${e.level}] app=${APP_NAME} message="${e.message?.replace(/"/g, "'")}"${errorFormat(e)}${meta(e.metadata)}`
})

const errorFormat = (e) => {
    if(e.level !== 'error'){
        return ''
    }

    return ` functionName=${e.functionName} filePath=${e.filePath} lineNumber=${e.lineNumber}`
}

const meta = (metadata) => {
    let data = ''

    if(metadata === undefined){
        return data
    }

    for (const [key, value] of Object.entries(metadata)){
        data += ` ${key}=${value}`
    }

    return data
}

module.exports = createLogger({
    level: LOGGING_LEVEL,
    format: combine(
        timestamp(),
        format.errors({stack: true}),
        format.metadata({ fillExcept: ['messages', 'level', 'timestamp', 'label', 'service'] }),
        logFormat
    ),
    defaultMeta: { service: APP_NAME },
    transports: [
        new transports.Console({ level: 'silly' }),
        new transports.DailyRotateFile({
            filename: './logs/%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d'
        })
    ],
})