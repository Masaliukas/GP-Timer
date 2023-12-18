exports.DBResponseHandler = (func) => {
    return async (...args) => {
        try {
            const result = await func(...args)
            return { error: false, response: result }
        } catch (error) {
            LOGGER.error(error)
            return { error: true, response: null }
        }
    }
};