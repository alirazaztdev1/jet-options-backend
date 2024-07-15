"use strict";

/**
 * A set of functions called "actions" for `flight-time`
 */

const axios = require("axios");
const AVIAPAGES_API_KEY = process.env.AVIAPAGES_API_KEY;
const AVIAPAGES_API_URL = process.env.AVIAPAGES_API_URL;
const headerForAviaPages = {
  Authorization: `Token ${AVIAPAGES_API_KEY}`,
};

module.exports = {
  async calculateFlightTime(ctx) {
    const { quote, aircraft } = ctx.request.query;
    let legs = await strapi.db
      .query("api::leg.leg")
      .findMany({ where: { quote } });

    legs = await Promise.all(
      legs.map(async (leg) => {
        try {
          const flightTimeResponse = await strapi.db
            .query("api::legs-flight-time.legs-flight-time")
            .findOne({ where: { leg: leg.id, aircraft_detail: aircraft } });

          return {
            ...leg,
            flightTime: flightTimeResponse.flightTime,
          };
        } catch (error) {
          console.log(error);
          return { ...leg, flightTime: null };
        }
      })
    );
    return legs;
  },
};
