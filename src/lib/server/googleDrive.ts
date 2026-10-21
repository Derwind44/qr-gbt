import { google, drive_v3 } from "googleapis";

let drive: drive_v3.Drive | null | undefined;

/** Drive client for the service account, or null when credentials are missing. */
export function getDrive(): drive_v3.Drive | null {
  if (drive !== undefined) return drive;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    drive = null;
    return drive;
  }

  const auth = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/drive"] });
  drive = google.drive({ version: "v3", auth });
  return drive;
}

