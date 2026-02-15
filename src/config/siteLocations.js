import { fetchSiteLocations } from "../utils/masterDataHelpers";

// Configuration for site locations (fallback jika DB kosong)
export const SITE_LOCATIONS = {
  BSIB: [
    "Office",
    "Workshop",
    "OSP",
    "PIT A",
    "PIT C",
    "PIT E",
    "Candrian",
    "HLO",
  ],
  // Default options for other sites to avoid empty imports usage
  DEFAULT: ["Office", "Workshop", "Lainnya"],
};

// Sites that allow custom input (can be typed)
export const CUSTOM_INPUT_SITES = [
  "Head Office",
  "Balikpapan",
  "ADRO",
  "AMMP",
  "BSIB",
  "GAMR",
  "HRSB",
  "HRSE",
  "PABB",
  "PBRB",
  "PKJA",
  "PPAB",
  "PSMM",
  "REBH",
  "RMTU",
  "PMTU",
];

// Sync: ambil dari config (fallback)
export const getLocationOptions = (site) => {
  return SITE_LOCATIONS[site] || SITE_LOCATIONS.DEFAULT;
};

// Async: ambil dari DB, fallback ke config jika kosong
export async function getLocationOptionsAsync(site) {
  if (!site) return getLocationOptions(site);
  const fromDb = await fetchSiteLocations(site);
  if (fromDb && fromDb.length > 0) return fromDb;
  return getLocationOptions(site);
}

// Function to check if a site has specific locations
export const hasSpecificLocations = (site) => {
  return SITE_LOCATIONS[site] && SITE_LOCATIONS[site].length > 0;
};

// Function to check if a site allows custom input
export const allowsCustomInput = (site) => {
  return CUSTOM_INPUT_SITES.includes(site);
};

// Function to check if a site should use LocationDetailSelector
export const shouldUseLocationSelector = (site) => {
  return SITE_LOCATIONS[site] && SITE_LOCATIONS[site].length > 0;
};
