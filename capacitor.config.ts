import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "il.co.ftable.postpilot",
  appName: "PostPilot",
  webDir: "out",
  backgroundColor: "#0a0a0a",
  server: {
    url: "https://postpilot.ftable.co.il",
    cleartext: false,
  },
  ios: {
    scheme: "PostPilot",
    contentInset: "automatic",
    backgroundColor: "#0a0a0a",
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0a0a0a",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
