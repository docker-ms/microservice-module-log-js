'use strict';

module.exports = (consulKVLoggerWinstonConfigKey) => {

  const Promise = require('bluebird');

  if (!consulKVLoggerWinstonConfigKey || typeof consulKVLoggerWinstonConfigKey !== 'string') {
    return Promise.reject(new Error('Invalid consul cluster KV store key for logger winston configuration.'));
  }

  const consul = require('microservice-consul');
  const utils = require('microservice-utils');

  return utils.pickRandomly(consul.agents).kv.get(consulKVLoggerWinstonConfigKey).then((res) => {
    if (!res) {
      return Promise.reject('No logger winston configuration record found in consul kv store by this key.');
    }

    const loggerWinstonConfig = JSON.parse(res.Value);

    const winston = require('winston');

    switch (loggerWinstonConfig.logLevelStyle) {
      case 'RFC5424':
        winston.setLevels(winston.config.syslog.levels);
        break;
      case 'npm':
        winston.setLevels(winston.config.npm.levels);
        break;
      default:
        winston.setLevels(winston.config.syslog.levels);
    }

    const logger = new winston.Logger({
      level: loggerWinstonConfig.logLevel,
      transports: [
        new winston.transports.Console({
          json: true,
          stringify: true,
          timestamp: true
        })
      ]
    });
    
    return Promise.resolve({
      logger: logger,
      logOpts: loggerWinstonConfig.logOpts
    });
  });

};


