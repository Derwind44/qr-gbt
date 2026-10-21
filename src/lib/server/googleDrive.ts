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

/** Removes "anyone with the link" access. Returns false when the service account may not change sharing. */
export async function removePublicAccess(fileId: string): Promise<boolean> {
  const client = getDrive();
  if (!client) return false;

  const { data } = await client.permissions.list({
    fileId,
    supportsAllDrives: true,
    fields: "permissions(id,type)",
  });
  for (const p of data.permissions ?? []) {
    if (p.type === "anyone" && p.id) {
      await client.permissions.delete({ fileId, permissionId: p.id, supportsAllDrives: true });
    }
  }
  return true;
}
