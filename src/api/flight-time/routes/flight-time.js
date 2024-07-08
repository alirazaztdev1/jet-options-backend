module.exports = {
  routes: [
    {
      method: "GET",
      path: "/calculate-flight-time",
      handler: "flight-time.calculateFlightTime",
      policies: [],
      middlewares: [],
    },
  ],
};
