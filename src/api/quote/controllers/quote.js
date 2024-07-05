"use strict";

/**
 * quote controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::quote.quote", ({ strapi }) => ({
  async find(ctx) {
    const result = await super.find(ctx);

    result.data = await Promise.all(
      result.data.map(async (quote) => {
        const legs = await strapi.db
          .query("api::leg.leg")
          .findMany({ where: { quote: quote.id } });
        return { ...quote, attributes: { ...quote.attributes, legs: legs } };
      })
    );

    return result;
  },

  async findOne(ctx) {
    const result = await super.findOne(ctx);

    const legs = await strapi.db
      .query("api::leg.leg")
      .findMany({ where: { quote: result.data.id } });

    const aircrafts = await strapi.db
      .query("api::aircraft-detail.aircraft-detail")
      .findMany({ where: { quote: result.data.id } });

    return {
      ...result,
      data: {
        ...result.data,
        attributes: {
          ...result.data.attributes,
          legs: legs,
          arcrafts: aircrafts,
        },
      },
    };
  },
}));
