export const AIRPORT_ALIASES: Record<string, string> = {
  "new york": "JFK",
  nyc: "JFK",
  "new york city": "JFK",
  "ny": "JFK",
  jfk: "JFK",
  "los angeles": "LAX",
  la: "LAX",
  lax: "LAX",
  chicago: "ORD",
  "o'hare": "ORD",
  ohare: "ORD",
  ord: "ORD",
  memphis: "MEM",
  miami: "MIA",
  atlanta: "ATL",
  "san francisco": "SFO",
  sfo: "SFO",
  louisville: "SDF",
  dublin: "DUB",
  "dublin ireland": "DUB",
  ireland: "DUB",
  frankfurt: "FRA",
  fra: "FRA",
  london: "LHR",
  "london heathrow": "LHR",
  heathrow: "LHR",
  lhr: "LHR",
  amsterdam: "AMS",
  ams: "AMS",
  paris: "CDG",
  "paris cdg": "CDG",
  cdg: "CDG",
  "paris charles de gaulle": "CDG",
  luxembourg: "LUX",
  lux: "LUX",
  madrid: "MAD",
  istanbul: "IST",
  dubai: "DXB",
  dxb: "DXB",
  doha: "DOH",
  qatar: "DOH",
  "abu dhabi": "AUH",
  tokyo: "NRT",
  "tokyo narita": "NRT",
  narita: "NRT",
  "hong kong": "HKG",
  hkg: "HKG",
  singapore: "SIN",
  sin: "SIN",
  shanghai: "PVG",
  pvg: "PVG",
  seoul: "ICN",
  incheon: "ICN",
  icn: "ICN",
  bangalore: "BLR",
  bengaluru: "BLR",
  blr: "BLR",
  mumbai: "BOM",
  bombay: "BOM",
  bom: "BOM",
  delhi: "DEL",
  "new delhi": "DEL",
  del: "DEL",
  "mexico city": "MEX",
  mexico: "MEX",
  "sao paulo": "GRU",
  "são paulo": "GRU",
  gru: "GRU",
};

export function normalizeAirport(input: string): string | null {
  if (!input) return null;
  const cleaned = input.trim().toLowerCase();

  if (/^[a-z]{3}$/i.test(cleaned)) {
    return cleaned.toUpperCase();
  }

  if (AIRPORT_ALIASES[cleaned]) return AIRPORT_ALIASES[cleaned];

  for (const [alias, iata] of Object.entries(AIRPORT_ALIASES)) {
    if (cleaned.includes(alias)) return iata;
  }

  return null;
}
