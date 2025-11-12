export function computeDisplayName(email: string, googleName?: string) {
    const raw = googleName || email.split("@")[0] || "User";
    return raw.length > 20 ? raw.slice(0, 20) : raw;
  }
  