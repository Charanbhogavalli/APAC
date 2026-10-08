/**
 * Canonical helper to construct official public participant profile URL
 * Strictly matches the required structure: /participant/{profileId}
 */
export function getParticipantProfileUrl(profileId: string): string {
  if (!profileId) return '';
  const origin = window.location.origin;
  return `${origin}/participant/${profileId}`;
}
