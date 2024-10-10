// navigation/linking.js
export const linking = {
  prefixes: ['https://suno.com', 'https://suno.ai', 'https://suno.ma'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: {
            path: 'song/:id',
          },
          Create: 'create',
          Library: 'playlist/:id',

          Profile: 'profile',
          Download: 'download',
        },
      },
      Settings: 'settings',
    },
  },
}