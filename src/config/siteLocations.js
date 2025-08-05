// Configuration for site locations
export const SITE_LOCATIONS = {
  BSIB: [
    'Office',
    'Workshop',
    'OSP',
    'PIT A',
    'PIT C',
    'PIT E',
    'Candrian',
    'HLO',
  ],
};

// Sites that allow custom input (can be typed)
export const CUSTOM_INPUT_SITES = [
  'Head Office',
  'Balikpapan',
  'ADRO',
  'AMMP',
  'BSIB',
  'GAMR',
  'HRSB',
  'HRSE',
  'PABB',
  'PBRB',
  'PKJA',
  'PPAB',
  'PSMM',
  'REBH',
  'RMTU',
  'PMTU',
];

// Function to get location options for a specific site
export const getLocationOptions = site => {
  return SITE_LOCATIONS[site] || ['Office', 'Workshop', 'Lainnya'];
};

// Function to check if a site has specific locations
export const hasSpecificLocations = site => {
  return SITE_LOCATIONS[site] && SITE_LOCATIONS[site].length > 0;
};

// Function to check if a site allows custom input
export const allowsCustomInput = site => {
  return CUSTOM_INPUT_SITES.includes(site);
};

// Function to check if a site should use LocationDetailSelector
export const shouldUseLocationSelector = site => {
  return SITE_LOCATIONS[site] && SITE_LOCATIONS[site].length > 0;
};
