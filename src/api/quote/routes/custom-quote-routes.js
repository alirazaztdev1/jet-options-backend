module.exports = {
  routes: [
    {
      method: "POST",
      path: "/book-quote",
      handler: "quote.bookQuote",
      config: {
        auth: false,
      },
      policies: [],
      middlewares: [],
    },
  ],
};
