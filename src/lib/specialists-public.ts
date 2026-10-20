export type PublicSpecialist = {
  id: string;
  kind: "doctor" | "usta";
  name: string;
  specialty: string;
  city: string;
  clinic: string;
  about: string;
  image: string;
  href: string;
};

export async function fetchSpecialists(): Promise<PublicSpecialist[]> {
  try {
    const res = await fetch("/api/specialists", { credentials: "same-origin" });
    const json = (await res.json()) as { ok?: boolean; people?: PublicSpecialist[] };
    if (!json.ok || !Array.isArray(json.people)) return [];
    return json.people.filter((item) => item && typeof item.id === "string" && typeof item.name === "string");
  } catch {
    return [];
  }
}
