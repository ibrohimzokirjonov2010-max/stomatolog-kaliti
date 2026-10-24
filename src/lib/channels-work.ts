import {
  MIN_CHANNEL_BID,
  type Channel,
  type ChannelCategory,
} from "@/data/channels";

const STORAGE_KEY = "sk-kanallar-v1";

export type ChannelsOverlay = {
  added: Channel[];
  bidOverrides: Record<string, number>;
};

export type BidResult =
  | { ok: true; channel: Channel | undefined; rank: number }
  | { ok: false; reason: "not_found" | "too_low"; minRequired: number };

export type AddChannelInput = {
  username: string;
  name?: string;
  category: ChannelCategory | "";
};

export function emptyChannelsOverlay(): ChannelsOverlay {
  return { added: [], bidOverrides: {} };
}

function isChannel(value: unknown): value is Channel {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.username === "string" &&
    typeof v.category === "string"
  );
}

export function loadChannelsOverlay(): ChannelsOverlay {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyChannelsOverlay();
    const parsed = JSON.parse(raw) as Partial<ChannelsOverlay>;
    return {
      added: Array.isArray(parsed.added) ? parsed.added.filter(isChannel) : [],
      bidOverrides:
        parsed.bidOverrides && typeof parsed.bidOverrides === "object"
          ? Object.fromEntries(
              Object.entries(parsed.bidOverrides).map(([k, v]) => [
                k,
                Number(v) || 0,
              ])
            )
          : {},
    };
  } catch {
    return emptyChannelsOverlay();
  }
}

export function saveChannelsOverlay(overlay: ChannelsOverlay) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));
}

export function normalizeUsername(value: string) {
  const clean = value
    .trim()
    .replace(/^@+/, "")
    .replace(/[^a-zA-Z0-9_]/g, "");
  return clean ? `@${clean}` : "";
}

const avatarPalette = [
  "#0F766E",
  "#0F766E",
  "#7c3aed",
  "#ea580c",
  "#db2777",
  "#0F766E",
  "#059669",
  "#0F766E",
];

function sortByBid(list: Channel[]) {
  return [...list].sort((a, b) =>
    b.bidSum !== a.bidSum
      ? b.bidSum - a.bidSum
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/** Database channels plus optimistic adds, sorted by auction bid. */
export function mergeChannels(overlay: ChannelsOverlay): Channel[] {
  const overrides = overlay.bidOverrides;
  const added = overlay.added.map((c) => ({
    ...c,
    bidSum: overrides[c.id] ?? c.bidSum,
  }));
  return sortByBid(added);
}

/** `rank`-o‘rinni olish uchun minimal taklif. */
export function minBidToOutrank(channels: Channel[], rank = 1) {
  const sorted = sortByBid(channels);
  if (sorted.length === 0) return MIN_CHANNEL_BID;
  const idx = Math.max(0, Math.min(rank, sorted.length) - 1);
  const target = sorted[idx];
  return Math.max(MIN_CHANNEL_BID, (target?.bidSum ?? 0) + 1);
}

export function placeBid(
  overlay: ChannelsOverlay,
  channelId: string,
  amount: number
): { overlay: ChannelsOverlay; result: BidResult } {
  const merged = mergeChannels(overlay);
  if (!merged.find((c) => c.id === channelId)) {
    return {
      overlay,
      result: { ok: false, reason: "not_found", minRequired: MIN_CHANNEL_BID },
    };
  }
  const min = minBidToOutrank(merged, 1);
  const value = Math.floor(Number(amount));
  if (!Number.isFinite(value) || value < min) {
    return {
      overlay,
      result: { ok: false, reason: "too_low", minRequired: min },
    };
  }
  const next: ChannelsOverlay = {
    ...overlay,
    bidOverrides: { ...overlay.bidOverrides, [channelId]: value },
    added: overlay.added.map((c) =>
      c.id === channelId ? { ...c, bidSum: value } : c
    ),
  };
  const nextMerged = mergeChannels(next);
  const idx = sortByBid(nextMerged).findIndex((c) => c.id === channelId);
  return {
    overlay: next,
    result: {
      ok: true,
      channel: nextMerged.find((c) => c.id === channelId),
      rank: idx >= 0 ? idx + 1 : 0,
    },
  };
}

function buildChannel(input: AddChannelInput): Channel | null {
  const username = normalizeUsername(input.username);
  if (!username || username.length < 3 || !input.category) return null;
  const name = (input.name ?? "").trim() || username.replace(/^@/, "");
  const color = avatarPalette[Math.floor(Math.random() * avatarPalette.length)];
  return {
    id: `ch-u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    username,
    name,
    category: input.category,
    bidSum: MIN_CHANNEL_BID,
    avatarColor: color,
    mine: true,
    createdAt: new Date().toISOString(),
  };
}

export function addChannel(
  overlay: ChannelsOverlay,
  input: AddChannelInput
): {
  overlay: ChannelsOverlay;
  channel: Channel | null;
  reason?: "duplicate" | "invalid";
} {
  const channel = buildChannel(input);
  if (!channel) return { overlay, channel: null, reason: "invalid" };
  const exists = mergeChannels(overlay).some(
    (c) => c.username.toLowerCase() === channel.username.toLowerCase()
  );
  if (exists) return { overlay, channel: null, reason: "duplicate" };
  return { overlay: { ...overlay, added: [channel, ...overlay.added] }, channel };
}

export function avatarInitials(channel: Pick<Channel, "name" | "username">) {
  const base = (channel.name || channel.username).replace(/^@/, "").trim();
  const words = base.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase() || "CH";
}

export function telegramUrl(username: string) {
  return `https://t.me/${username.replace(/^@+/, "")}`;
}
