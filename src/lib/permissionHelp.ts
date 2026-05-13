/**
 * Returns the most relevant browser-specific permission help URL for a given
 * device (microphone or camera), based on the current user agent. Falls back
 * to a generic Chrome help page when the browser can't be confidently
 * identified.
 */
export type PermissionDevice = "microphone" | "camera";

interface BrowserHelp {
  name: string;
  microphone: string;
  camera: string;
}

const HELP: Record<string, BrowserHelp> = {
  chrome: {
    name: "Chrome",
    microphone: "https://support.google.com/chrome/answer/2693767",
    camera: "https://support.google.com/chrome/answer/2693767",
  },
  edge: {
    name: "Edge",
    microphone:
      "https://support.microsoft.com/en-us/microsoft-edge/microsoft-edge-camera-microphone-and-location-permissions-b9430174-f4f3-5b1d-2ee4-b67a1c30bb29",
    camera:
      "https://support.microsoft.com/en-us/microsoft-edge/microsoft-edge-camera-microphone-and-location-permissions-b9430174-f4f3-5b1d-2ee4-b67a1c30bb29",
  },
  firefox: {
    name: "Firefox",
    microphone:
      "https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions",
    camera:
      "https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions",
  },
  safari: {
    name: "Safari",
    microphone: "https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac",
    camera: "https://support.apple.com/guide/safari/websites-ibrwe2159f50/mac",
  },
  opera: {
    name: "Opera",
    microphone: "https://help.opera.com/en/latest/web-preferences/#camera",
    camera: "https://help.opera.com/en/latest/web-preferences/#camera",
  },
};

function detectBrowser(): keyof typeof HELP {
  if (typeof navigator === "undefined") return "chrome";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "edge";
  if (/OPR\//.test(ua) || /Opera/.test(ua)) return "opera";
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Chrome\//.test(ua)) return "chrome";
  if (/Safari\//.test(ua) && /AppleWebKit/.test(ua)) return "safari";
  return "chrome";
}

export function getPermissionHelp(device: PermissionDevice): {
  browser: string;
  url: string;
} {
  const key = detectBrowser();
  const entry = HELP[key];
  return { browser: entry.name, url: entry[device] };
}
