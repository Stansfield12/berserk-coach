import 'dotenv/config';

export default {
  expo: {
    name: 'MyApp',
    slug: 'my-app',
    version: '1.0.0',
    extra: {

        OPENAI_KEY: process.env.OPENAI_API_KEY,
    },
  },
};