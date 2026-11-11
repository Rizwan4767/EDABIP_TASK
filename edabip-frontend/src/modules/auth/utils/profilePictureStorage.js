const STORAGE_KEY = "edabip_profile_pictures";

function readStore() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function readProfilePicture(email) {
  if (!email) return null;
  return readStore()[email] || null;
}

export function saveProfilePicture(email, dataUrl) {
  if (!email) return;
  const store = readStore();
  store[email] = dataUrl;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
