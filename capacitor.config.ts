import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.biomistrz.app',
  appName: 'Biomistrz',
  webDir: 'dist',


  server: {
    androidScheme: 'https'

  },
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
  },
};
export default config;
