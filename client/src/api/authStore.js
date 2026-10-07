const key = "fundsroom-auth";
export const authStore = {
  get: () => JSON.parse(localStorage.getItem(key) || "null"),
  set: (value) => localStorage.setItem(key, JSON.stringify(value)),
  clear: () => localStorage.removeItem(key),
};
