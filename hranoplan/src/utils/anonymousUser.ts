import { v5 as uuidv5 } from "uuid";

const ANONYMOUS_USER_KEY = "anonymous_user_id";
const NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341"; // Random UUID as namespace

// Get browser fingerprint using available information
function getBrowserFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
    // @ts-expect-error - deviceMemory is available in modern browsers
    navigator.deviceMemory,
    navigator.maxTouchPoints,
  ].filter(Boolean);

  return components.join("|");
}

// Get or create anonymous user ID
export function getAnonymousUserId(): string {
  if (typeof window === "undefined") {
    throw new Error("getAnonymousUserId must be called from the client side");
  }

  // First try to get existing ID from localStorage
  const storedId = localStorage.getItem(ANONYMOUS_USER_KEY);
  if (storedId) {
    return storedId;
  }

  // Generate new ID using browser fingerprint
  const fingerprint = getBrowserFingerprint();
  const name = `anonymous-${fingerprint}`;
  const uniqueId = uuidv5(name, NAMESPACE);

  // Store the ID
  localStorage.setItem(ANONYMOUS_USER_KEY, uniqueId);

  return uniqueId;
}
