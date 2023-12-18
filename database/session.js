const { DataDatabase } = require('./connection');


exports.DataDatabaseSession = {
    start: async () => {
        try{
            return await DataDatabase.startSession()
        } catch (error) {
            LOGGER.error(error)
            throw error
        }
    }
}