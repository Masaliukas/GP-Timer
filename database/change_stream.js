const AcceptedActions = [
    DATABASE_ACTIONS.insert,
    DATABASE_ACTIONS.replace,
    DATABASE_ACTIONS.update,
    DATABASE_ACTIONS.delete
]

const actionIdentifier = (change, fnActionHandler, fnErrorHandler) => {
    if(AcceptedActions.includes(change.operationType)){
        fnActionHandler({
            method  : change.operationType,
            doc_id  : change.documentKey._id,
            data    : change.fullDocument? change.fullDocument: null
        })
    } else {
        fnErrorHandler()
    }
}



function ChangeStream(collection, options, fnActionHandler, fnErrorHandler){
    const changeStream = collection.watch([], options);

    changeStream.on('change', function (change) {
        actionIdentifier(change, fnActionHandler)
    })

    changeStream.on('error', function (error) {
        LOGGER.error(error)
        fnErrorHandler()
    })

    return changeStream
}

exports.ChangeStream = ChangeStream