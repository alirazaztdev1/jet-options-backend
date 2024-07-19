"use strict";

/**
 * quote controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const path = require("path");
const ejs = require("ejs");
const moment = require("moment");
const axios = require("axios");
const AVIAPAGES_API_KEY = process.env.AVIAPAGES_API_KEY;
const AVIAPAGES_API_URL = process.env.AVIAPAGES_API_URL;
const AVIAPAGES_AIRPORT_API_URL =
  "https://dir.aviapages.com/api/airports/?search_icao=";
const headerForAviaPages = {
  Authorization: `Token ${AVIAPAGES_API_KEY}`,
};

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

    let { legsData } = ctx.request.body;

    legsData = legsData.map((legData) => {
      let departureDate = moment(legData.date);
      let arrivalDate = moment(legData.arrivalDate);

      const duration = moment.duration(legData.flightTime, "minutes");
      const hours = Math.floor(duration.asHours());
      const minutes = duration.minutes();
      const formattedTime = moment({ hour: hours, minute: minutes }).format(
        "H:mm"
      );

      return {
        ...legData,
        departureDate: departureDate.format("MM/DD/YYYY"),
        departureTime: departureDate.format("h:mm A"),
        arrivalDate: arrivalDate.format("MM/DD/YYYY"),
        arrivalTime: arrivalDate.format("h:mm A"),
        flightTime: formattedTime,
      };
    });

    const quoteData = await strapi.db
      .query("api::quote.quote")
      .findOne({ where: { id: quote } });

    const brokerData = await strapi.db
      .query("api::broker-setting.broker-setting")
      .findOne({ where: { user: quoteData.user } });

    const userData = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { id: quoteData.user } });

    const aircraftData = await strapi.db
      .query("api::aircraft-detail.aircraft-detail")
      .findOne({
        where: { id: aircraft },
        populate: { airplane_make: true, airplane_model: true },
      });

    const emailTemplate = await ejs.renderFile(
      path.join(__dirname, "..", "templates/book-quote.ejs"),
      {
        brokerData,
        quoteData,
        aircraftData,
        legsData,
      }
    );

    await strapi.plugins["email"].services.email.send({
      to: userData.email,
      from: process.env.JET_OPTIONS_EMAIL_ADDRESS,
      subject:
        quoteData.actionRequest == "contract"
          ? "Requested contract"
          : "Request Approval",
      html: emailTemplate,
      text: "test",
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

    const createdLegs = await Promise.all(
      legs.map(async (leg) => {
        const aviaPagesApiUrlWithFromCode = `${AVIAPAGES_AIRPORT_API_URL}${leg?.data?.from}`;
        const aviaPagesApiUrlWithToCode = `${AVIAPAGES_AIRPORT_API_URL}${leg?.data?.to}`;
        const aviaResponseWithNameForFrom = await axios.get(
          aviaPagesApiUrlWithFromCode,
          {
            headers: headerForAviaPages,
          }
        );

        const aviaResponseWithNameForTo = await axios.get(
          aviaPagesApiUrlWithToCode,
          {
            headers: headerForAviaPages,
          }
        );

        return await strapi.service("api::leg.leg").create({
          ...leg,
          data: {
            ...leg.data,
            fromCity: aviaResponseWithNameForFrom.data?.results[0]?.city_name,
            toCity: aviaResponseWithNameForTo.data?.results[0]?.city_name,
          },
        });
      })
    );

    const createdAircrafts = await Promise.all(
      aircrafts.map(async (aircraft) => {
        return await strapi
          .service("api::aircraft-detail.aircraft-detail")
          .create(aircraft);
      })
    );

    await Promise.all(
      createdAircrafts.map(async (createdAircraft) => {
        const aircraftData = await strapi.db
          .query("api::aircraft-detail.aircraft-detail")
          .findOne({
            where: { id: createdAircraft.id },
            populate: { airplane_make: true, airplane_model: true },
          });

        const aircraftModel = `${aircraftData.airplane_make.make} ${aircraftData.airplane_model.model}`;

        await Promise.all(
          createdLegs.map(async (leg) => {
            try {
              const flightCalculatePayload = {
                departure_airport: leg.from,
                arrival_airport: leg.to,
                aircraft: aircraftModel,
                pax: leg.passengers,
                airway_time: true,
                airway_time_weather_impacted: true,
                departure_datetime: leg.date.substring(0, 19),
                arrival_datetime: true,
              };
              const flightTimeResponse = await axios.post(
                AVIAPAGES_API_URL,
                flightCalculatePayload,
                {
                  headers: headerForAviaPages,
                }
              );

              console.log(
                "----------------AVIA Response------------",
                flightTimeResponse.data,
                "\n----------------Object for Creation---------------",
                {
                  leg: leg.id,
                  quote: result.data.id,
                  aircraft_detail: createdAircraft.id,
                  flightTime: flightTimeResponse.data?.time?.airway,
                }
              );

              await strapi.db
                .query("api::legs-flight-time.legs-flight-time")
                .create({
                  data: {
                    leg: leg.id,
                    quote: result.data.id,
                    aircraft_detail: createdAircraft.id,
                    flightTime: flightTimeResponse.data?.time?.airway,
                    arrivalTime: flightTimeResponse.data?.time?.arrival_local_airway
                  },
                });
            } catch (error) {
              console.log(error);
              await strapi.db
                .query("api::legs-flight-time.legs-flight-time")
                .create({
                  data: {
                    leg: leg.id,
                    quote: result.data.id,
                    aircraft_detail: createdAircraft.id,
                    flightTime: null,
                  },
                });
            }
          })
        );
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
      .findMany({
        where: { quote: result.data.id },
        populate: { airplane_make: true, airplane_model: true },
      });

    const brokerSettings = await strapi.db
      .query("api::broker-setting.broker-setting")
      .findOne({
        where: { user: result.data.attributes.user },
        populate: { logo: true },
      });

    return {
      ...result,
      data: {
        ...result.data,
        attributes: {
          ...result.data.attributes,
          legs: legs,
          arcrafts: aircrafts,
          brokerSettings,
        },
      },
    };
  },
}));
