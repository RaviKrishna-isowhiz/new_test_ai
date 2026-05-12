type User = { email: string; name?: string } | null;

const STORAGE_KEY = 'ai-planet-user';

export function getUser(): User {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setUser(user: User) {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
    try {
      // notify other windows/components
      const ev = new CustomEvent('ai-planet:user-changed', { detail: user });
      window.dispatchEvent(ev);
    } catch (e) { /* ignore */ }
  } catch (e) {
    // ignore
  }
}

export function clearUser() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  try {
    const ev = new CustomEvent('ai-planet:user-changed', { detail: null });
    window.dispatchEvent(ev);
  } catch (e) { /* ignore */ }
}

export function authenticate(email: string, password: string) {
  // static credentials
  const validEmail = 'demouser@aiplanet.ai';
  const validPassword = 'Pass1234';

  if (email.toLowerCase() === validEmail && password === validPassword) {
    const user = { email: validEmail, name: 'Demo User' };
    setUser(user);
    return { success: true, user };
  }

  return { success: false };
}
