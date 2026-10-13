// The 11 campus / local food stalls (same list and spelling as the API).
export const STALL_NAMES = [
  "Pizza Pedrico's",
  'Naster Siomai',
  'Lola Ines',
  'Golden Way Cafeteria',
  'NUCrk Corner',
  'NUC Cafe by 3rd Degree',
  'Lapapangs',
  'Daily Baon',
  'KRLM Food Hub',
  "Delgal's Food Hub",
  'Sobremesa',
] as const;
export type StallName = (typeof STALL_NAMES)[number];

export const ALL_STALLS = 'All stalls';
export const STALL_FILTERS = [ALL_STALLS, ...STALL_NAMES] as const;
export type StallFilter = (typeof STALL_FILTERS)[number];
