/** Segment chosen at sign-up. Stored on the profile specialty and on the lead. */
export const SIGNUP_ROLES = [
  { id: "Stomatolog", label: "Stomatolog", sub: "Amaliyotchi shifokor" },
  { id: "Talaba", label: "Talaba", sub: "Tibbiyot talabasi" },
  { id: "Klinika egasi", label: "Klinika egasi", sub: "Klinika rahbari" },
  { id: "Tish texnigi", label: "Tish texnigi", sub: "Laboratoriya mutaxassisi" },
  { id: "Sotuvchi", label: "Sotuvchi", sub: "Mahsulotlar sotuvchisi" },
] as const;

export type SignupRoleId = (typeof SIGNUP_ROLES)[number]["id"];

export function signupRole(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return SIGNUP_ROLES.some((role) => role.id === text) ? text : "";
}
