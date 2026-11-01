/**
 * The auth API rejects a sign-in with this error code when the device
 * already holds a session for the account being signed in: under the
 * multi-session model that sign-in is an account addition, and the
 * server refuses the conflict instead of creating a session. Clients
 * only present the error; the detection itself lives on the server.
 */
export const DEVICE_SESSION_CONFLICT_CODE = 'account_already_signed_in';

/** Whether an auth client error is the device-session conflict above. */
export function isDeviceSessionConflict(error: unknown): boolean {
  return (error as { code?: string } | null | undefined)?.code === DEVICE_SESSION_CONFLICT_CODE;
}
