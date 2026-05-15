export const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

export const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: "Subuh",
  dhuhr: "Zohor",
  asr: "Asar",
  maghrib: "Maghrib",
  isha: "Isyak",
};

export const ZONES = [
  { code: "WLY01", name: "Kuala Lumpur / Putrajaya" },
  { code: "WLY02", name: "Labuan" },
  { code: "SGR01", name: "Gombak / Hulu Langat / Sepang" },
  { code: "SGR02", name: "Petaling / Klang / Kuala Langat" },
  { code: "SGR03", name: "Kuala Selangor / Sabak Bernam" },
  { code: "JHR01", name: "Pulau Aur / Pulau Pemanggil" },
  { code: "JHR02", name: "Johor Bahru / Kota Tinggi" },
  { code: "JHR03", name: "Kluang / Pontian" },
  { code: "JHR04", name: "Batu Pahat / Muar / Segamat" },
  { code: "KDH01", name: "Kota Setar / Kubang Pasu" },
  { code: "KDH02", name: "Kulim / Bandar Baharu" },
  { code: "KTN01", name: "Kota Bharu / Pasir Mas" },
  { code: "MLK01", name: "Melaka" },
  { code: "NSN01", name: "Nilai / Seremban / Port Dickson" },
  { code: "PHG01", name: "Kuantan / Pekan / Rompin" },
  { code: "PNG01", name: "Pulau Pinang" },
  { code: "PRK01", name: "Ipoh / Kuala Kangsar" },
  { code: "PRK02", name: "Teluk Intan / Bagan Datuk" },
  { code: "PLS01", name: "Kangar / Arau" },
  { code: "SBH01", name: "Kota Kinabalu" },
  { code: "SBH02", name: "Sandakan" },
  { code: "SWK01", name: "Kuching" },
  { code: "SWK02", name: "Sibu" },
  { code: "SWK03", name: "Miri" },
  { code: "TRG01", name: "Kuala Terengganu / Marang" },
  { code: "TRG02", name: "Besut / Setiu" },
  { code: "TRG03", name: "Hulu Terengganu" },
];

export type PrayerTimes = Partial<Record<PrayerKey, string>>;
export type WeatherLoc = { name: string; lat: number; lon: number };
export type WeatherData = { temp: number; code: number };
export type Reminder = { id: string; text: string; date: string; time: string };
export type GeoResult = { name: string; country: string; admin1?: string; latitude: number; longitude: number };

export const FONTS = [
  { id: "montserrat",       label: "Montserrat" },
  { id: "inter",            label: "Inter" },
  { id: "roboto",           label: "Roboto" },
  { id: "poppins",          label: "Poppins" },
  { id: "raleway",          label: "Raleway" },
  { id: "nunito",           label: "Nunito" },
  { id: "playfair-display", label: "Playfair Display" },
  { id: "lato",             label: "Lato" },
  { id: "oswald",           label: "Oswald" },
  { id: "dm-sans",          label: "DM Sans" },
] as const;

export type FontId = typeof FONTS[number]["id"];

export type FontSize = "xs" | "sm" | "md" | "lg" | "xl";

export const FONT_SIZES: { id: FontSize; label: string; name: string }[] = [
  { id: "xs", label: "XS", name: "Extra Small" },
  { id: "sm", label: "S",  name: "Small"       },
  { id: "md", label: "M",  name: "Normal"      },
  { id: "lg", label: "L",  name: "Large"       },
  { id: "xl", label: "XL", name: "Extra Large" },
];

export const FONT_SCALE: Record<FontSize, number> = {
  xs: 0.80,
  sm: 0.90,
  md: 1.00,
  lg: 1.15,
  xl: 1.30,
};

export type BgConfig = {
  color: string;
  fontColor: string;
  showQuran: boolean;
  showDailyQuote: boolean;
  showWeather: boolean;
  showCopyright: boolean;
  showNote: boolean;
  showPlayer: boolean;
  showQuranPlayer: boolean;
  showReminder: boolean;
  showRest: boolean;
  showPrayers: boolean;
  showHijri: boolean;
  quranFont: "naskh" | "kitab";
  fontFamily: FontId;
  fontSize: FontSize;
};

export const DEFAULT_BG: BgConfig = {
  color: "#0a0a0a",
  fontColor: "#ffffff",
  showQuran: false,
  showDailyQuote: false,
  showWeather: false,
  showCopyright: true,
  showNote: false,
  showPlayer: false,
  showQuranPlayer: false,
  showReminder: false,
  showRest: true,
  showPrayers: true,
  showHijri: false,
  quranFont: "naskh",
  fontFamily: "montserrat",
  fontSize: "md",
};

export function getWeatherInfo(code: number): { label: string; kind: "sun" | "partly" | "cloud" | "rain" | "snow" | "storm" | "fog" } {
  if (code === 0 || code === 1)   return { label: "Clear sky",     kind: "sun"    };
  if (code === 2)                 return { label: "Partly cloudy", kind: "partly" };
  if (code === 3)                 return { label: "Overcast",      kind: "cloud"  };
  if (code === 45 || code === 48) return { label: "Foggy",         kind: "fog"    };
  if (code >= 51 && code <= 57)   return { label: "Drizzle",       kind: "rain"   };
  if (code >= 61 && code <= 67)   return { label: "Rain",          kind: "rain"   };
  if (code >= 71 && code <= 77)   return { label: "Snow",          kind: "snow"   };
  if (code >= 80 && code <= 82)   return { label: "Showers",       kind: "rain"   };
  if (code >= 85 && code <= 86)   return { label: "Snow showers",  kind: "snow"   };
  if (code >= 95)                 return { label: "Thunderstorm",  kind: "storm"  };
  return { label: "—", kind: "cloud" };
}

export function parseHHMM(raw: string): number {
  const [h, m, s = 0] = raw.trim().split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

export function hexToRgbStr(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}
