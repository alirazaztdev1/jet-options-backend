module.exports = ({ env }) => ({
  email: {
    config: {
      provider: "amazon-ses",
      providerOptions: {
        key: env("JO_AWS_ACCESS_KEY_ID"),
        secret: env("JO_AWS_SECRET_ACCESS_KEY_ID"),
        amazon: "https://email.ap-southeast-2.amazonaws.com",
      },
      settings: {
        defaultFrom: "aliraza.ztdev1@gmail.com",
        defaultReplyTo: "aliraza.ztdev1@gmail.com",
      },
    },
  },
  upload: {
    config: {
      provider: "aws-s3",
      providerOptions: {
        credentials: {
          accessKeyId: env("JO_AWS_ACCESS_KEY_ID"),
          secretAccessKey: env("JO_AWS_SECRET_ACCESS_KEY_ID"),
        },
        region: env("JO_AWS_REGION"),
        baseUrl: `https://s3.${env("JO_AWS_REGION")}.amazonaws.com/${env(
          "JO_AWS_BUCKET"
        )}`,
        params: {
          ACL: "public-read", // <== set ACL to private
          signedUrlExpires: 15 * 60,
          Bucket: env("JO_AWS_BUCKET"),
        },
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
