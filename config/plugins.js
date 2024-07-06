module.exports = ({ env }) => ({
  email: {
    config: {
      provider: "sendgrid",
      providerOptions: {
        apiKey: env("SENDGRID_API_KEY"),
      },
      settings: {
        defaultFrom: "bisharat.akram1999@gmail.com",
        defaultReplyTo: "bisharat.akram1999@gmail.com",
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
