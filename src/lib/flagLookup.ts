// src/lib/flagLookup.ts

/**
 * @description Lookup table mapping country names to their Unicode flag emoji.
 * @returns {Record<string, string>} Map of country name to flag emoji string
 */
export const FLAG_LOOKUP: Record<string, string> = {
  Mexico: "🇲🇽",
  "South Africa": "🇿🇦",
  "South Korea": "🇰🇷",
  "Korea Republic": "🇰🇷",
  "Czech Republic": "🇨🇿",
  Canada: "🇨🇦",
  "Bosnia & Herzegovina": "🇧🇦",
  Qatar: "🇶🇦",
  Switzerland: "🇨🇭",
  Brazil: "🇧🇷",
  Morocco: "🇲🇦",
  Haiti: "🇭🇹",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  USA: "🇺🇸",
  "United States": "🇺🇸",
  Paraguay: "🇵🇾",
  Australia: "🇦🇺",
  Turkey: "🇹🇷",
  "Türkiye": "🇹🇷",
  Germany: "🇩🇪",
  "Curaçao": "🇨🇼",
  "Ivory Coast": "🇨🇮",
  Ecuador: "🇪🇨",
  Netherlands: "🇳🇱",
  Japan: "🇯🇵",
  Sweden: "🇸🇪",
  Tunisia: "🇹🇳",
  Belgium: "🇧🇪",
  Egypt: "🇪🇬",
  Iran: "🇮🇷",
  "New Zealand": "🇳🇿",
  Spain: "🇪🇸",
  "Cape Verde": "🇨🇻",
  "Saudi Arabia": "🇸🇦",
  Uruguay: "🇺🇾",
  France: "🇫🇷",
  Senegal: "🇸🇳",
  Iraq: "🇮🇶",
  Norway: "🇳🇴",
  Argentina: "🇦🇷",
  Algeria: "🇩🇿",
  Austria: "🇦🇹",
  Jordan: "🇯🇴",
  Portugal: "🇵🇹",
  "DR Congo": "🇨🇩",
  Uzbekistan: "🇺🇿",
  Colombia: "🇨🇴",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Croatia: "🇭🇷",
  Ghana: "🇬🇭",
  Panama: "🇵🇦",
};

/**
 * @description Returns the flag emoji for a given country name, falling back to a white flag if not found.
 * @param {string} name - The country name to look up
 * @returns {string} The Unicode flag emoji, or "🏳" if not found
 */
export function getFlag(name: string): string {
  return FLAG_LOOKUP[name] ?? "🏳";
}
