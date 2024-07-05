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
}));
