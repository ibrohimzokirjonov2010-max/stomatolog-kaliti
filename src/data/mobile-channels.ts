export type ChannelPlatform = "telegram" | "instagram" | "youtube";
export type ChannelTopic = "implantologiya" | "endodontiya" | "talim" | "umumiy" | "jarrohlik" | "estetika" | "ortodontiya";

export type MobileChannel = {
  id: string;
  handle: string;
  topic: ChannelTopic;
  topicLabel: string;
  platform: ChannelPlatform;
  subscribers: number;
  subscribersLabel: string;
  offer: number;
  image: string;
};

export const channelPlatforms: { id: ChannelPlatform; label: string }[] = [
  { id: "telegram", label: "Telegram" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
];

export const channelTopics: { id: "all" | ChannelTopic; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "implantologiya", label: "Implantologiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "estetika", label: "Estetika" },
];

export const mobileChannels: MobileChannel[] = [
  { id: "ch-implant", handle: "@implant_clinic", topic: "implantologiya", topicLabel: "Implantologiya", platform: "telegram", subscribers: 12400, subscribersLabel: "12 400 obunachi", offer: 10_007, image: "/img/mobile/d-ch-implant.jpg" },
  { id: "ch-endo", handle: "@endo_pro_uz", topic: "endodontiya", topicLabel: "Endodontiya", platform: "instagram", subscribers: 8600, subscribersLabel: "8 600 obunachi", offer: 5_000, image: "/img/mobile/d-ch-endo.jpg" },
  { id: "ch-academy", handle: "@dental_academy_uz", topic: "talim", topicLabel: "Ta’lim", platform: "instagram", subscribers: 25300, subscribersLabel: "25 300 obunachi", offer: 3_500, image: "/img/mobile/d-ch-academy.jpg" },
  { id: "ch-uz", handle: "@uz_dent", topic: "umumiy", topicLabel: "Umumiy stomatologiya", platform: "youtube", subscribers: 18900, subscribersLabel: "18 900 obunachi", offer: 3_000, image: "/img/mobile/d-ch-uz.jpg" },
  { id: "ch-sardor", handle: "@dr.sardorbek", topic: "jarrohlik", topicLabel: "Jarrohlik", platform: "telegram", subscribers: 14200, subscribersLabel: "14 200 obunachi", offer: 2_500, image: "/img/mobile/d-ch-sardor.jpg" },
  { id: "ch-tips", handle: "@dental_tips_uz", topic: "estetika", topicLabel: "Estetika", platform: "instagram", subscribers: 31500, subscribersLabel: "31 500 obunachi", offer: 2_000, image: "/img/mobile/d-ch-tips.jpg" },
  { id: "ch-orto", handle: "@stomatologiya_uz", topic: "ortodontiya", topicLabel: "Ortodontiya", platform: "youtube", subscribers: 9800, subscribersLabel: "9 800 obunachi", offer: 1_500, image: "/img/mobile/d-ch-orto.jpg" },
  { id: "ch-oral", handle: "@oral_surgery_uz", topic: "jarrohlik", topicLabel: "Jarrohlik", platform: "telegram", subscribers: 8400, subscribersLabel: "8 400 obunachi", offer: 1_200, image: "/img/mobile/d-ch-oral.jpg" },
];
