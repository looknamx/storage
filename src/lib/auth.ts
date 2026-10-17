/**
 * Daily Session Management for PIN Authentication
 * Sessions automatically expire when a new calendar day begins (ขึ้นวันใหม่).
 */

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isProgramAuthenticated(program: 'a' | 'b' | 'c'): boolean {
  if (typeof window === 'undefined') return false;
  const storageKey = `auth_program_${program}`;
  const today = getTodayDateString();

  try {
    const valLocal = localStorage.getItem(storageKey);
    const valSession = sessionStorage.getItem(storageKey);

    // If stored date matches today's date, session is valid for today
    if (valLocal === today || valSession === today) {
      return true;
    }

    // Automatically remove expired session (from previous days or legacy 'true')
    if (valLocal || valSession) {
      clearProgramAuth(program);
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  return false;
}

export function setProgramAuthenticated(program: 'a' | 'b' | 'c'): void {
  if (typeof window === 'undefined') return;
  const storageKey = `auth_program_${program}`;
  const today = getTodayDateString();

  try {
    localStorage.setItem(storageKey, today);
    sessionStorage.setItem(storageKey, today);
  } catch (e) {
    // Ignore
  }
}

export function clearProgramAuth(program: 'a' | 'b' | 'c'): void {
  if (typeof window === 'undefined') return;
  const storageKey = `auth_program_${program}`;
  try {
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
  } catch (e) {
    // Ignore
  }
}

