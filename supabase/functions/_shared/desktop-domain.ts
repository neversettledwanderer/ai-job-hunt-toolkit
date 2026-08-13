export const applicationTransitions: Record<string, readonly string[]> = {
  draft: ["ready", "withdrawn"],
  ready: ["draft", "applied", "withdrawn"],
  applied: ["screening", "interviewing", "rejected", "withdrawn"],
  screening: ["interviewing", "rejected", "withdrawn"],
  interviewing: ["offer", "rejected", "withdrawn"],
  offer: ["accepted", "rejected", "withdrawn"],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

export function validateApplicationTransition(
  from: string,
  to: string,
  appliedDate: string | null | undefined,
): string | null {
  if (to === "applied" && !appliedDate) {
    return "An applied date is required when an application is applied.";
  }
  if (from === to) return null;
  if (!applicationTransitions[from]?.includes(to)) {
    return `Application cannot move from ${from} to ${to}.`;
  }
  return null;
}

export function isStaleWrite(expected: string | null | undefined, actual: string | null | undefined): boolean {
  if (!expected) return false;
  if (!actual) return true;
  return new Date(expected).getTime() !== new Date(actual).getTime();
}
