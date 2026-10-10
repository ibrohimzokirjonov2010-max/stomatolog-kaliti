export type PostKind = "case" | "savol" | "yangilik";

export type CommunityAuthor = {
  name: string;
  specialty: string;
  city: string;
  avatar?: string;
  verified?: boolean;
};

export type CommunityReply = {
  id: string;
  author: string;
  time: string;
  text: string;
  avatar?: string;
  authorId?: string;
  createdAt?: string;
};

export type CommunityPost = {
  id: string;
  kind: PostKind;
  author: CommunityAuthor;
  time: string;
  text: string;
  images?: string[];
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  replies: CommunityReply[];
  createdAt?: string;
  postedLocal?: boolean;
  /** Static seed content (not from the database). */
  demo?: boolean;
  authorId?: string;
  likedByMe?: boolean;
};

export const postKindLabels: Record<PostKind, string> = {
  case: "Case",
  savol: "Savol",
  yangilik: "Yangilik",
};

export const feedPosts: CommunityPost[] = [
  {
    id: "jamshid-implant-case",
    kind: "case",
    author: {
      name: "Dr. Jamshid R.",
      specialty: "Implantolog",
      city: "Toshkent",
      avatar: "/images/usta-jamshid.png",
      verified: true,
    },
    time: "2 soat oldin",
    text: "Upper molar implant case. Pacientda 6 tish yo‘qolgan. Bone quality past bo‘lgani uchun sinus lift + PRF bilan augmentatsiya qildim. 4 oy keyin implant o‘rnatildi. CT va intraoral holat ilova qilaman. Tajribangiz bilan o‘rtoqlashing.",
    images: ["/images/seminar-xray.png", "/images/seminar-smile.png"],
    tags: ["Implantologiya", "Endodontiya", "Case"],
    likes: 24,
    comments: 8,
    shares: 5,
    replies: [
      {
        id: "r1",
        author: "Dr. Dilshod S.",
        time: "1 soat oldin",
        text: "Bone augmentation uchun qaysi materialdan foydalandingiz? Natijasi ajoyib bo‘libdi!",
        avatar: "/images/usta-jamshid.png",
      },
      {
        id: "r2",
        author: "Dr. Azizbek",
        time: "40 daqiqa oldin",
        text: "PRF protokolini yozib qo‘ysangiz, foydali bo‘lardi. Lateral window yoki crestal approach?",
        avatar: "/images/avatar-azizbek.png",
      },
      {
        id: "r5",
        author: "Dr. Sardor K.",
        time: "25 daqiqa oldin",
        text: "Sinus lift + PRF yaxshi tanlov. CBCT da residual bone height qancha edi?",
        avatar: "/images/usta-sardor.png",
      },
    ],
    demo: true,
  },
  {
    id: "nigora-endo-question",
    kind: "savol",
    author: {
      name: "Dr. Nigora A.",
      specialty: "Endodontist",
      city: "Samarqand",
      avatar: "/images/usta-akbar.png",
      verified: true,
    },
    time: "5 soat oldin",
    text: "Bu kabi apical periodontitis holatda retreatment qilish kerakmi yoki apikal resection yaxshiroqmi? Kimga qarshi tajribangiz bo‘lsa, maslahat bering.",
    tags: ["Endodontiya", "Savol"],
    likes: 11,
    comments: 4,
    shares: 1,
    replies: [
      {
        id: "r3",
        author: "Dr. Farrukh J.",
        time: "3 soat oldin",
        text: "Avval CBCT bilan kanal anatomiyasini ko‘ring. Agar instrument broken bo‘lmasa, men retreatmentdan boshlayman.",
        avatar: "/images/usta-akbar.png",
      },
    ],
    demo: true,
  },
  {
    id: "azizbek-congress-news",
    kind: "yangilik",
    author: {
      name: "Dr. Azizbek",
      specialty: "Stomatolog",
      city: "Toshkent",
      avatar: "/images/avatar-azizbek.png",
      verified: true,
    },
    time: "Kecha",
    text: "Toshkentdagi implantologiya kongressi dasturi e’lon qilindi. Live surgery va digital workflow bloklari bor. Kim boradi?",
    images: ["/images/seminar-congress.png"],
    tags: ["Yangilik", "Implantologiya"],
    likes: 18,
    comments: 3,
    shares: 7,
    replies: [],
    demo: true,
  },
  {
    id: "sardor-graft-question",
    kind: "savol",
    author: {
      name: "Dr. Sardor K.",
      specialty: "Implantolog",
      city: "Toshkent",
      avatar: "/images/usta-sardor.png",
      verified: true,
    },
    time: "Kecha",
    text: "Horizontal ridge augmentationda autogenous block o‘rniga xenograft + membrane yetadimi? Kichik defekt, 1 tish oraliq.",
    images: ["/images/product-graft.png"],
    tags: ["Bone Graft", "Savol"],
    likes: 9,
    comments: 2,
    shares: 0,
    replies: [],
    demo: true,
  },
  {
    id: "malika-aligner-case",
    kind: "case",
    author: {
      name: "Dr. Malika T.",
      specialty: "Ortodontist",
      city: "Toshkent",
      avatar: "/images/forma-banner-doctor.png",
      verified: true,
    },
    time: "2 kun oldin",
    text: "Kattalar aligner case: crowding + mild Class II. 14 oy, IPR minimal. Retention protokolini qanday yuritasiz?",
    images: ["/images/seminar-braces.png"],
    tags: ["Protetika", "Case"],
    likes: 15,
    comments: 6,
    shares: 2,
    replies: [
      {
        id: "r4",
        author: "Dr. Jamshid R.",
        time: "1 kun oldin",
        text: "Vivera + night-only 6 oydan keyin. Overcorrectionni 0.2 mm qoldiraman.",
        avatar: "/images/usta-jamshid.png",
      },
    ],
    demo: true,
  },
];

export const suggestedTags = [
  "Implantologiya",
  "Endodontiya",
  "Bone Graft",
  "Digital Dentistry",
  "Protetika",
  "Ortodontiya",
] as const;

export const placeholderImages: Record<PostKind, string> = {
  case: "/images/seminar-xray.png",
  savol: "/images/seminar-smile.png",
  yangilik: "/images/seminar-congress.png",
};

export const trendTopics = [
  { tag: "Implantologiya", posts: 124 },
  { tag: "Endodontiya", posts: 98 },
  { tag: "Bone Graft", posts: 67 },
  { tag: "Digital Dentistry", posts: 53 },
  { tag: "Protetika", posts: 41 },
];

export type TopDoctor = {
  id: string;
  name: string;
  specialty: string;
  score: number;
  avatar?: string;
};

export const topDoctors: TopDoctor[] = [
  {
    id: "sardor-k",
    name: "Dr. Sardor K.",
    specialty: "Implantolog",
    score: 125,
    avatar: "/images/usta-sardor.png",
  },
  {
    id: "malika-t",
    name: "Dr. Malika T.",
    specialty: "Ortodontist",
    score: 98,
    avatar: "/images/forma-banner-doctor.png",
  },
  {
    id: "farrukh-j",
    name: "Dr. Farrukh J.",
    specialty: "Endodontist",
    score: 76,
    avatar: "/images/usta-akbar.png",
  },
];

export const communityRules = [
  "Professional tone saqlang",
  "Bemor nomini va shaxsiy ma’lumotlarini ulashmang",
  "Hurmat va odob doirasida muloqot qiling",
];

export const communityRulesExtra = [
  "Klinik fotosuratlarda yuz va ID ni yoping.",
  "Reklama, spam va narx dumping taqiqlanadi.",
  "Munozara tibbiy maslahat o‘rnini bosmaydi — bu hamkasblar forumi.",
];

export function getPost(id: string) {
  return feedPosts.find((post) => post.id === id);
}

export function communityHref(postId?: string) {
  return postId ? `/community/${postId}` : "/community";
}

export function latestCommunityPosts(limit = 1) {
  return feedPosts.slice(0, limit);
}
