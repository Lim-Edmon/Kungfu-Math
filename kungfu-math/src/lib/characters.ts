/** Kungfu Math — Author: Lim Edmon · Full disclaimer: src/App.tsx */

import type { Character } from "./types";

/** Slice default Yu Jin; Tap default Yo Rin — di urutan teratas per mode */
export const CHARACTERS: Character[] = [
  {
    id: "yu-jin",
    name: "Yu Jin",
    nicknameId: "Tombak Awan",
    nicknameEn: "Cloud Spear",
    gender: "female",
    mode: "slice",
    weapon: "tombak",
    emoji: "🔱",
    color: "#7b2d8e",
    blurbId: "Tombak ringan bagai awan",
    imageSrc: "/characters/yu-jin-full.png",
    imageCloseSrc: "/characters/yu-jin-close.png",
  },
  {
    id: "hong-yi",
    name: "Hong Yi",
    nicknameId: "Tongkat Teguh",
    nicknameEn: "Steadfast Staff",
    gender: "male",
    mode: "slice",
    weapon: "tongkat",
    emoji: "🪵",
    color: "#c41e3a",
    blurbId: "Pendekar tongkat yang tenang dan kokoh",
    imageSrc: "/characters/hong-yi-full.png",
    imageCloseSrc: "/characters/hong-yi-close.png",
  },
  {
    id: "ming-zhe",
    name: "Ming Zhe",
    nicknameId: "Pedang Bijak",
    nicknameEn: "Wise Blade",
    gender: "male",
    mode: "slice",
    weapon: "pedang",
    emoji: "⚔️",
    color: "#d4a017",
    blurbId: "Pedang tajam, hati bijak",
    imageSrc: "/characters/ming-zhe-full.png",
    imageCloseSrc: "/characters/ming-zhe-close.png",
  },
  {
    id: "yo-rin",
    name: "Yo Rin",
    nicknameId: "Tendangan Angin",
    nicknameEn: "Mist Kick",
    gender: "female",
    mode: "tap",
    style: "tendangan",
    emoji: "💨",
    color: "#e65100",
    blurbId: "Tendangan cepat seperti angin",
    imageSrc: "/characters/yo-rin-full.png",
    imageCloseSrc: "/characters/yo-rin-close.png",
  },
  {
    id: "an-ning",
    name: "An Ning",
    nicknameId: "Tinju Damai",
    nicknameEn: "Peaceful Fist",
    gender: "male",
    mode: "tap",
    style: "shaolin",
    emoji: "👊",
    color: "#2e7d32",
    blurbId: "Tinju damai ala Shaolin",
    imageSrc: "/characters/an-ning-full.png",
    imageCloseSrc: "/characters/an-ning-close.png",
  },
  {
    id: "zhi-xing",
    name: "Zhi Xing",
    nicknameId: "Telapak Sakti",
    nicknameEn: "Knowing Palm",
    gender: "male",
    mode: "tap",
    style: "telapak",
    emoji: "✋",
    color: "#1565c0",
    blurbId: "Telapak yang tahu jalan benar",
    imageSrc: "/characters/zhi-xing-full.png",
    imageCloseSrc: "/characters/zhi-xing-close.png",
  },
];

export function getCharactersByMode(mode: "slice" | "tap"): Character[] {
  return CHARACTERS.filter((c) => c.mode === mode);
}

export function getDefaultCharacter(mode: "slice" | "tap"): Character {
  if (mode === "slice") {
    return CHARACTERS.find((c) => c.id === "yu-jin")!;
  }
  return CHARACTERS.find((c) => c.id === "yo-rin")!;
}

export function getCharacterById(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}
