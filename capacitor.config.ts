import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.biomistrz.app',
  appName: 'biomistrz---matura-z-biologii',
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
