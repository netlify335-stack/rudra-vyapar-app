import { v4 as uuidv4 } from "uuid";

const DEVICE_ID_KEY = "rudra_billing_device_id";

export function getDeviceId(): string {
  // Only runs on client
  if (typeof window === "undefined") return "server";

  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
