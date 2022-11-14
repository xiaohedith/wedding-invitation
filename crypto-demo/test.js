const log4js = require('log4js');

function producer(){
const logger = log4js.getLogger('producer');
logger.trace('Entering cheese testing');

  log4js.configure({
        appenders: { 
            producer: { type: 'file