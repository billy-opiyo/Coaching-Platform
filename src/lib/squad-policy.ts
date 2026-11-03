export function isSquadPolicyApproved(): boolean {
  return process.env.SQUADS_POLICIES_APPROVED === "true" && Boolean(process.env.SQUADS_POLICY_VERSION?.trim() && process.env.SQUADS_POLICY_TEXT?.trim());
}

export function hasAvailableSquadSeat(currentMemberCount: number, capacity: number, open: boolean): boolean {
  return open && currentMemberCount < capacity;
}

export function getSquadPolicyVersion(): string | null {
  return isSquadPolicyApproved() ? process.env.SQUADS_POLICY_VERSION?.trim() ?? null : null;
}

export function getSquadPolicyText(): string | null {
  return isSquadPolicyApproved() ? process.env.SQUADS_POLICY_TEXT?.trim() ?? null : null;
}
