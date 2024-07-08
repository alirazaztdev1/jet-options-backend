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
    const { quote, aircraftModel } = ctx.request.query;
    let legs = await strapi.db
      .query("api::leg.leg")
      .findMany({ where: { quote } });

    legs = await Promise.all(
      legs.map(async (leg) => {
        try {
          const flightCalculatePayload = {
            departure_airport: leg.from,
            arrival_airport: leg.to,
            aircraft: aircraftModel,
            pax: leg.passengers,
            airway_time: true,
          };
          const flightTimeResponse = await axios.post(
            AVIAPAGES_API_URL,
            flightCalculatePayload,
            {
              headers: headerForAviaPages,
            }
          );
          return {
            ...leg,
            flightTime: flightTimeResponse.data?.time?.airway,
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
