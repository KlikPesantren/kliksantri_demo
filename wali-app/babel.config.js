module.exports = function (api) {
  api.cache(true);

  // EAS build: write-eas-env.js menulis Railway URL ke .env
  // Local dev: .env.development → backend laptop (IP LAN)
  const envPath =
    process.env.EAS_BUILD === 'true' ? '.env' : '.env.development';

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          envName: 'APP_ENV',
          moduleName: '@env',
          path: envPath,
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
