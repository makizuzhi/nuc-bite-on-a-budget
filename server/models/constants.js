// Shared enums so the schemas, the seed script and the routes agree.
// The default expense categories are only SUGGESTIONS: a student may type any custom
// category (2-30 characters), so Transaction.category is a free string, not an enum.
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'School', 'Supplies'];
const CATEGORY_RULES = { min: 2, max: 30 };

// The 11 campus / local food stalls that drive the Craving Randomizer.
const STALL_NAMES = [
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
];
const ALL_STALLS = 'All stalls'; // filter option only, never stored on a document

module.exports = { DEFAULT_CATEGORIES, CATEGORY_RULES, STALL_NAMES, ALL_STALLS };
