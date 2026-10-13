// Raw seed data. Dates are expressed as "days ago" so the demo always looks
// current (the dashboard's "today" always has the Lunch and Campus ride entries).
//
// The expense list is designed so the demo allowance cycle has clean numbers:
//   Food 3,300 + Transport 1,800 + School 1,350 + Supplies 1,050 = 7,500 spent
//   of a 15,000 allowance  ->  7,500 remaining, 50% used, 250/day, 1,750/week.

const user = {
  fullName: 'Alex Mendoza',
  email: 'alex.mendoza@student.edu',
  role: 'Student',
  allowance: 15000,
  cycleLengthDays: 30,
  // cycleStart is computed in seed.js (20 days ago => today is day 21 of the cycle)
  program: 'BS Information Technology',
  studentNumber: '2024-00123',
  preferences: { defaultMaxBudget: 150, defaultStall: 'All stalls', lowAllowanceAlertPercent: 20 },
};

// [daysAgo, 'HH:MM', category, amount, description]
const expenses = [
  // ---- Food (3,300) ----
  [0, '12:40', 'Food', 145, 'Lunch'],
  [1, '19:10', 'Food', 95, 'Tapsilog dinner'],
  [2, '07:30', 'Food', 60, 'Pandesal and coffee'],
  [3, '18:45', 'Food', 180, 'Ramen with classmates'],
  [4, '12:15', 'Food', 110, 'Sisig rice'],
  [5, '12:30', 'Food', 85, 'Chicken adobo lunch'],
  [6, '19:30', 'Food', 250, 'Samgyup share'],
  [7, '18:00', 'Food', 220, 'Instant noodles and eggs (grocery)'],
  [8, '13:00', 'Food', 130, 'Fried chicken'],
  [9, '12:20', 'Food', 75, 'Siomai rice'],
  [10, '19:00', 'Food', 160, 'Burger and fries'],
  [11, '15:30', 'Food', 55, 'Turon and juice'],
  [12, '20:00', 'Food', 180, 'Weekend dinner'],
  [13, '13:10', 'Food', 200, 'Pizza slices (shared)'],
  [14, '12:00', 'Food', 120, 'Canteen lunch'],
  [15, '18:20', 'Food', 95, 'Pancit canton'],
  [16, '16:40', 'Food', 140, 'Milk tea and snacks'],
  [17, '12:50', 'Food', 110, 'Cheeseburger'],
  [18, '19:15', 'Food', 90, 'Dinner'],
  [19, '14:00', 'Food', 290, 'Birthday treat for a friend'],
  [19, '21:30', 'Food', 160, 'Late-night snack run'],
  [20, '07:45', 'Food', 120, 'Breakfast'],
  [20, '19:45', 'Food', 230, 'Dinner out'],

  // ---- Transport (1,800) ----
  [0, '08:15', 'Transport', 25, 'Campus ride'],
  [1, '08:10', 'Transport', 25, 'Campus ride'],
  [2, '08:05', 'Transport', 25, 'Campus ride'],
  [3, '08:20', 'Transport', 25, 'Campus ride'],
  [4, '08:10', 'Transport', 25, 'Campus ride'],
  [5, '06:30', 'Transport', 400, 'Bus fare home (weekend)'],
  [6, '08:15', 'Transport', 25, 'Campus ride'],
  [7, '08:05', 'Transport', 25, 'Campus ride'],
  [8, '08:10', 'Transport', 25, 'Campus ride'],
  [9, '08:00', 'Transport', 25, 'Campus ride'],
  [9, '17:00', 'Transport', 200, 'Beep card load'],
  [10, '08:15', 'Transport', 25, 'Campus ride'],
  [11, '08:10', 'Transport', 25, 'Campus ride'],
  [12, '16:30', 'Transport', 400, 'Bus fare back to dorm'],
  [13, '08:05', 'Transport', 25, 'Campus ride'],
  [14, '08:20', 'Transport', 25, 'Campus ride'],
  [15, '08:10', 'Transport', 25, 'Campus ride'],
  [16, '08:15', 'Transport', 25, 'Campus ride'],
  [17, '08:00', 'Transport', 25, 'Campus ride'],
  [18, '08:10', 'Transport', 25, 'Campus ride'],
  [19, '22:10', 'Transport', 350, 'Grab ride (heavy rain)'],
  [20, '08:15', 'Transport', 25, 'Campus ride'],

  // ---- School (1,350) ----
  [1, '16:10', 'School', 85, 'Notebook'],
  [3, '10:00', 'School', 300, 'Printing and bookbinding'],
  [6, '09:30', 'School', 150, 'Lab fee'],
  [8, '15:00', 'School', 225, 'Group project materials'],
  [11, '11:00', 'School', 120, 'Photocopy of reviewers'],
  [14, '14:00', 'School', 200, 'Org membership fee'],
  [16, '10:30', 'School', 170, 'Quiz bee registration'],
  [18, '13:00', 'School', 100, 'Online course voucher'],

  // ---- Supplies (1,050) ----
  [2, '17:30', 'Supplies', 180, 'Toiletries'],
  [4, '18:00', 'Supplies', 120, 'Laundry detergent'],
  [7, '16:00', 'Supplies', 250, 'Hygiene kit'],
  [10, '14:30', 'Supplies', 90, 'Ballpens and highlighters'],
  [13, '17:45', 'Supplies', 150, 'Phone load'],
  [15, '15:15', 'Supplies', 110, 'Batteries and extension cord'],
  [17, '18:30', 'Supplies', 150, 'Dorm cleaning supplies'],
];

// Monthly limits per category (alert fires at 80% by default).
const categoryBudgets = [
  { category: 'Food', limit: 4500 },
  { category: 'Transport', limit: 2500 },
  { category: 'School', limit: 2000 },
  { category: 'Supplies', limit: 1500 },
];

// The 11 campus / local food stalls. Every stall and menu item below is MADE UP for the school
// project (names of stalls come from the project brief; dishes and prices are sample data).
// Prices are realistic student-budget estimates in PHP.
const stalls = [
  {
    name: "Pizza Pedrico's", specialty: 'Pizza by the slice', description: 'Quick, cheesy slices and pan pizzas for a between-class meal.',
    menu: [
      ['Cheese Pizza Slice', 55, 'Classic mozzarella slice'], ['Pepperoni Pizza Slice', 65, 'Pepperoni and cheese'],
      ['Hawaiian Pizza Slice', 65, 'Ham and pineapple'], ['Garlic Bread', 45, 'Toasted with garlic butter'],
      ['Pizza Rice Bowl', 85, 'Rice topped with pizza sauce, cheese and sausage'], ['Personal Pan Pizza', 149, 'Whole 6-inch pizza, good for sharing'],
      ['Iced Tea', 30, 'House blend'],
    ],
  },
  {
    name: 'Naster Siomai', specialty: 'Siomai and dumplings', description: 'Steamed siomai served with rice and chili garlic sauce.',
    menu: [
      ['Pork Siomai (4 pcs)', 40, 'Steamed pork siomai'], ['Siomai Rice (4 pcs)', 55, 'Siomai with plain rice'],
      ['Jumbo Siomai (3 pcs)', 60, 'Extra large pork siomai'], ['Beef Siomai Rice', 65, 'Beef siomai with rice'],
      ['Hakaw (5 pcs)', 50, 'Shrimp dumplings'], ['Siomai with Egg Fried Rice', 75, 'Siomai and egg fried rice'],
      ['Siopao Asado', 35, 'Steamed bun with asado filling'],
    ],
  },
  {
    name: 'Lola Ines', specialty: 'Home-style Filipino meals', description: 'Comforting ulam-and-rice meals cooked the way lola does.',
    menu: [
      ['Chicken Adobo Rice', 85, 'Soy-vinegar braised chicken'], ['Pork Sinigang Meal', 110, 'Sour tamarind soup with pork'],
      ['Tapsilog', 95, 'Beef tapa, garlic rice and egg'], ['Longsilog', 80, 'Longganisa, garlic rice and egg'],
      ['Kare-Kare Meal', 130, 'Oxtail peanut stew with bagoong'], ['Ginataang Gulay Rice', 70, 'Vegetables in coconut milk'],
      ['Leche Flan', 40, 'Caramel custard'],
    ],
  },
  {
    name: 'Golden Way Cafeteria', specialty: 'Cafeteria rice meals', description: 'The busiest canteen on campus: pick your rice and one or two viands.',
    menu: [
      ['Rice with 1 Viand', 65, 'Choose one viand of the day'], ['Rice with 2 Viands', 85, 'Choose two viands of the day'],
      ['Pancit Canton', 50, 'Stir-fried noodles'], ['Fried Chicken with Rice', 99, 'Crispy fried chicken leg'],
      ['Lumpiang Shanghai (6 pcs)', 45, 'Fried spring rolls'], ['Sopas', 40, 'Creamy chicken macaroni soup'],
      ['Halo-Halo', 55, 'Shaved ice dessert'],
    ],
  },
  {
    name: 'NUCrk Corner', specialty: 'Sandwiches and quick bites', description: 'Grab-and-go snacks for a short break.',
    menu: [
      ['Hotdog Sandwich', 35, 'Hotdog in a soft bun'], ['Chicken Burger', 60, 'Crispy chicken patty burger'],
      ['French Fries (cup)', 40, 'Seasoned fries'], ['Cheesy Nachos', 70, 'Chips with cheese sauce'],
      ['Chicken Quesadilla', 85, 'Grilled tortilla with chicken and cheese'], ['Iced Coffee', 55, 'Sweet iced coffee'],
    ],
  },
  {
    name: 'NUC Cafe by 3rd Degree', specialty: 'Coffee and pastries', description: 'Campus cafe with espresso drinks, panini and baked goods.',
    menu: [
      ['Iced Americano', 85, 'Espresso over ice'], ['Caramel Macchiato', 115, 'Espresso, milk and caramel'],
      ['Spanish Latte', 120, 'Sweet condensed milk latte'], ['Matcha Latte', 125, 'Ceremonial-style matcha with milk'],
      ['Chicken Pesto Panini', 135, 'Pressed sandwich with pesto'], ['Ham and Cheese Croissant', 110, 'Buttery croissant'],
      ['Blueberry Muffin', 70, 'Baked fresh daily'],
    ],
  },
  {
    name: 'Lapapangs', specialty: 'Silog and grilled meals', description: 'Budget silog plates and grilled favorites.',
    menu: [
      ['Tocilog', 90, 'Sweet cured pork, garlic rice and egg'], ['Bangsilog', 95, 'Fried bangus, garlic rice and egg'],
      ['Pork BBQ (2 sticks) with Rice', 90, 'Grilled pork skewers'], ['Chicken Inasal with Rice', 105, 'Grilled chicken with annatto oil'],
      ['Hotsilog', 70, 'Hotdog, garlic rice and egg'], ['Isaw (3 sticks)', 30, 'Grilled chicken intestine skewers'],
    ],
  },
  {
    name: 'Daily Baon', specialty: 'Packed rice boxes', description: 'Ready-to-go baon boxes that stay filling on a tight budget.',
    menu: [
      ['Pork Adobo Box', 75, 'Rice and pork adobo'], ['Chicken Teriyaki Box', 90, 'Rice and teriyaki chicken'],
      ['Hungarian Sausage Rice Box', 70, 'Rice, sausage and egg'], ['Egg and Tuna Sandwich', 45, 'Two-slice sandwich'],
      ['Hotdog Fried Rice Box', 60, 'Fried rice with hotdog'], ['Mini Pancit Box', 55, 'Pancit bihon in a box'],
    ],
  },
  {
    name: 'KRLM Food Hub', specialty: 'Pares and rice toppings', description: 'Hearty pares, goto and lugaw for rainy days.',
    menu: [
      ['Beef Pares', 110, 'Braised beef, garlic rice and soup'], ['Pares Overload', 135, 'Extra beef and rice'],
      ['Lugaw with Egg', 45, 'Rice porridge with egg'], ['Goto', 55, 'Rice porridge with beef tripe'],
      ['Tokwa at Baboy', 60, 'Fried tofu and pork in vinegar'], ['Beef Mami', 80, 'Noodle soup with beef'],
    ],
  },
  {
    name: "Delgal's Food Hub", specialty: 'Pasta, wings and plated meals', description: 'Bigger plated meals for when you are really hungry.',
    menu: [
      ['Spaghetti', 75, 'Sweet-style Filipino spaghetti'], ['Creamy Carbonara', 95, 'Bacon cream pasta'],
      ['Burger Steak with Rice', 85, 'Beef patty with mushroom gravy'], ['Fish Fillet with Rice', 90, 'Crispy fish fillet with tartar sauce'],
      ['Pork Sisig Rice', 105, 'Sizzling pork sisig with rice'], ['Chicken Wings (6 pcs)', 140, 'Buffalo or garlic parmesan'],
    ],
  },
  {
    name: 'Sobremesa', specialty: 'Desserts and milk tea', description: 'Sweet treats and cool drinks to end the meal.',
    menu: [
      ['Classic Milk Tea', 70, 'With pearls'], ['Special Halo-Halo', 85, 'Leche flan, ube and sweet beans'],
      ['Mango Graham Cup', 65, 'Layered mango, cream and graham'], ['Leche Flan Cup', 45, 'Creamy caramel custard'],
      ['Chocolate Brownie', 55, 'Fudgy brownie square'], ['Ube Cheesecake Slice', 95, 'Purple yam cheesecake'],
      ['Turon (2 pcs)', 25, 'Fried banana roll with caramel'],
    ],
  },
];

// One food the demo student added to her own wheel (shows the "add your own foods" feature).
const customWheelItems = [['Golden Way Cafeteria', "Mom's Tinola Bowl", 70]];

const savingsGoals = [{ name: 'Emergency fund', targetAmount: 3000, status: 'active' }];

// Pocket starts empty (PHP 0); the demo shows how to edit it from the dashboard.
const savingsEntries = [];

const notifications = [
  { type: 'system', title: 'Welcome to NUC: Bite On A Budget', message: 'Track your allowance and find affordable meals on campus.', isRead: true, dedupeKey: 'welcome' },
  { type: 'system', title: 'Campus food stalls are ready', message: 'Browse the 11 campus stalls and spin the Food Wheel.', isRead: false, dedupeKey: 'system:stalls' },
  { type: 'weekly_summary', title: 'Weekly summary is ready', message: 'Review your spending and savings.', isRead: false },
];

// Login for the seeded demo student (shown on the login page).
const demoPassword = 'password123';

module.exports = { demoPassword, user, expenses, categoryBudgets, stalls, customWheelItems, savingsGoals, savingsEntries, notifications };
