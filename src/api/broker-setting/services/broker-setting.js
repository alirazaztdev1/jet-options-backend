'use strict';

/**
 * broker-setting service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::broker-setting.broker-setting');
