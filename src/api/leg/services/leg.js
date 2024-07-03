'use strict';

/**
 * leg service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::leg.leg');
