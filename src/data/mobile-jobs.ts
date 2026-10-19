import type { JobType } from "@/data/jobs";

/** Design sample vacancies for the mobile Ishlar screen. Labelled "Namuna" in the UI; nobody can apply to them. */
export type JobTile = "terapevt" | "ortoped" | "assistent" | "texnik" | "mamur";

export type MobileJobSample = {
  id: string;
  title: string;
  clinic: string;
  place: string;
  city: string;
  type: JobType;
  typeTone: "green" | "blue";
  typeText?: string;
  salaryMin: number;
  salaryMax: number;
  exp: string;
  ago: string;
  image: string;
  rank: number;
};

const img = (name: string) => `/img/mobile/${name}`;

export const jobTiles: { id: "" | JobTile; label: string; icon: string; match?: RegExp }[] = [
  { id: "", label: "Barchasi", icon: img("d-job-i1.png") },
  { id: "terapevt", label: "Stomatolog-terapevt", icon: img("d-job-i2.png"), match: /terapevt/ },
  { id: "ortoped", label: "Ortoped", icon: img("d-job-i3.png"), match: /ortoped/ },
  { id: "assistent", label: "Assistent", icon: img("d-job-i4.png"), match: /assistent|hamshira/ },
  { id: "texnik", label: "Tish texniki", icon: img("d-job-i5.png"), match: /texnik|laborant/ },
  { id: "mamur", label: "Ma’mur", icon: img("d-job-i6.png"), match: /ma.?mur|admin|menejer|resepsion|reception/ },
];

export const mobileJobSamples: MobileJobSample[] = [
  { id: "namuna-terapevt", title: "Stomatolog-terapevt", clinic: "Smile Dental", place: "Toshkent, Chilonzor", city: "Toshkent", type: "full", typeTone: "green", salaryMin: 8_000_000, salaryMax: 12_000_000, exp: "2+ yil tajriba", ago: "2 kun oldin", image: img("d-job-1.jpg"), rank: 1 },
  { id: "namuna-ortoped", title: "Stomatolog-ortoped", clinic: "Dental Care Clinic", place: "Toshkent, Yunusobod", city: "Toshkent", type: "shift", typeTone: "blue", typeText: "Moslashuvchan", salaryMin: 10_000_000, salaryMax: 15_000_000, exp: "3+ yil tajriba", ago: "1 kun oldin", image: img("d-job-2.jpg"), rank: 2 },
  { id: "namuna-assistent", title: "Stomatolog-assistent", clinic: "Family Dent", place: "Toshkent, Mirzo Ulug‘bek", city: "Toshkent", type: "full", typeTone: "green", salaryMin: 4_000_000, salaryMax: 6_000_000, exp: "Tajriba talab qilinmaydi", ago: "3 kun oldin", image: img("d-job-3.jpg"), rank: 3 },
  { id: "namuna-texnik", title: "Tish texniki (krown/veneer)", clinic: "Art Dental Lab", place: "Toshkent, Shayxontohur", city: "Toshkent", type: "full", typeTone: "blue", salaryMin: 6_000_000, salaryMax: 10_000_000, exp: "1+ yil tajriba", ago: "4 kun oldin", image: img("d-job-4.jpg"), rank: 4 },
  { id: "namuna-jarroh", title: "Stomatolog-jarroh (implantolog)", clinic: "Implant Clinic", place: "Toshkent, Olmazor", city: "Toshkent", type: "full", typeTone: "green", salaryMin: 12_000_000, salaryMax: 20_000_000, exp: "3+ yil tajriba", ago: "5 kun oldin", image: img("d-job-5.jpg"), rank: 5 },
];
