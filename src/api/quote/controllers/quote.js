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

  async bookQuote(ctx) {
    const { quote, aircraft } = ctx.request.body;

    const quoteData = await strapi.db
      .query("api::quote.quote")
      .findOne({ where: { id: quote } });

    const brokerData = await strapi.db
      .query("api::broker-setting.broker-setting")
      .findOne({ where: { user: quoteData.user } });

    const legsData = await strapi.db
      .query("api::leg.leg")
      .findMany({ where: { quote } });

    const aircraftData = await strapi.db
      .query("api::aircraft-detail.aircraft-detail")
      .findOne({
        where: { id: aircraft },
        populate: { airplane_make: true, airplane_model: true },
      });

    console.log("----------------all data---------", {
      quoteData,
      brokerData,
      legsData,
      aircraftData,
    });

    return {
      message: "Booked successfully",
    };
  },

  async create(ctx) {
    ctx.request.body.data.user = ctx.state.user.id;
    const result = await super.create(ctx);

    const legs = ctx.request.body.data.legs.map((leg) => ({
      data: {
        ...leg,
        quote: result.data.id.toString(),
      },
    }));

    const aircrafts = ctx.request.body.data.aircrafts.map((aircraft) => ({
      data: {
        ...aircraft,
        quote: result.data.id.toString(),
      },
    }));

    await Promise.all(
      legs.map(async (leg) => {
        await strapi.service("api::leg.leg").create(leg);
      })
    );

    await Promise.all(
      aircrafts.map(async (aircraft) => {
        await strapi
          .service("api::aircraft-detail.aircraft-detail")
          .create(aircraft);
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
