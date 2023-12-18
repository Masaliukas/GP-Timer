const {Client}                      = require('discord.js');
const Intents                       = require('./intents');


global.APP_NAME                     = process.env.APP_NAME
global.CLIENT_ID                    = process.env.APP_CLIENT_ID
global.APP_PARAMS                   = require('../params/app_setup.json');
global.DATABASE_ACTIONS             = require('../params/database_actions.json');
global.LOGGER                       = require('../logger/logger');
global.CLIENT                       = new Client({ intents: Intents });
global.PROCESS_ID                   = 0
global.DATA_DB_SESSION              = null