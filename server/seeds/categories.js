/**
 * Category Seed Data
 * Pre-defined item categories with subcategories
 */

const CATEGORIES = [
  // Tools
  {
    name: 'Tools',
    slug: 'tools',
    icon: '🔧',
    color: '#EF4444',
    subcategories: [
      { name: 'Hand Tools', slug: 'hand-tools', icon: '🔨' },
      { name: 'Power Tools', slug: 'power-tools', icon: '⚡' },
      { name: 'Measuring Tools', slug: 'measuring-tools', icon: '📏' },
      { name: 'Cutting Tools', slug: 'cutting-tools', icon: '✂️' },
      { name: 'Garden Tools', slug: 'garden-tools', icon: '🌱' },
      { name: 'Automotive Tools', slug: 'automotive-tools', icon: '🚗' },
    ],
  },

  // Hardware
  {
    name: 'Hardware',
    slug: 'hardware',
    icon: '🔩',
    color: '#6B7280',
    subcategories: [
      { name: 'Fasteners', slug: 'fasteners', icon: '🔩' },
      { name: 'Screws', slug: 'screws', icon: '🪛' },
      { name: 'Nails', slug: 'nails', icon: '📌' },
      { name: 'Bolts & Nuts', slug: 'bolts-nuts', icon: '🔧' },
      { name: 'Anchors', slug: 'anchors', icon: '⚓' },
      { name: 'Brackets', slug: 'brackets', icon: '📐' },
      { name: 'Hinges', slug: 'hinges', icon: '🚪' },
      { name: 'Hooks', slug: 'hooks', icon: '🪝' },
    ],
  },

  // Plumbing
  {
    name: 'Plumbing',
    slug: 'plumbing',
    icon: '🔧',
    color: '#0EA5E9',
    subcategories: [
      { name: 'Pipes & Fittings', slug: 'pipes-fittings', icon: '🔧' },
      { name: 'Valves', slug: 'valves', icon: '🚰' },
      { name: 'Faucets', slug: 'faucets', icon: '🚿' },
      { name: 'Drains', slug: 'drains', icon: '🕳️' },
      { name: 'Water Heater Parts', slug: 'water-heater', icon: '🔥' },
    ],
  },

  // Electrical
  {
    name: 'Electrical',
    slug: 'electrical',
    icon: '⚡',
    color: '#F59E0B',
    subcategories: [
      { name: 'Wire & Cable', slug: 'wire-cable', icon: '🔌' },
      { name: 'Outlets & Switches', slug: 'outlets-switches', icon: '🔘' },
      { name: 'Lighting', slug: 'lighting', icon: '💡' },
      { name: 'Breakers & Fuses', slug: 'breakers-fuses', icon: '⚡' },
      { name: 'Connectors', slug: 'connectors', icon: '🔗' },
      { name: 'Batteries', slug: 'batteries', icon: '🔋' },
    ],
  },

  // Building Materials
  {
    name: 'Building Materials',
    slug: 'building-materials',
    icon: '🧱',
    color: '#A16207',
    subcategories: [
      { name: 'Lumber', slug: 'lumber', icon: '🪵' },
      { name: 'Drywall', slug: 'drywall', icon: '⬜' },
      { name: 'Insulation', slug: 'insulation', icon: '🧤' },
      { name: 'Roofing', slug: 'roofing', icon: '🏠' },
      { name: 'Concrete & Masonry', slug: 'concrete-masonry', icon: '🧱' },
      { name: 'Flooring', slug: 'flooring', icon: '🪵' },
    ],
  },

  // Paint & Supplies
  {
    name: 'Paint & Supplies',
    slug: 'paint-supplies',
    icon: '🎨',
    color: '#8B5CF6',
    subcategories: [
      { name: 'Interior Paint', slug: 'interior-paint', icon: '🎨' },
      { name: 'Exterior Paint', slug: 'exterior-paint', icon: '🏠' },
      { name: 'Stains & Finishes', slug: 'stains-finishes', icon: '🪵' },
      { name: 'Brushes & Rollers', slug: 'brushes-rollers', icon: '🖌️' },
      { name: 'Tape & Drop Cloths', slug: 'tape-drop-cloths', icon: '📜' },
      { name: 'Caulk & Sealants', slug: 'caulk-sealants', icon: '🔧' },
    ],
  },

  // Safety & PPE
  {
    name: 'Safety & PPE',
    slug: 'safety-ppe',
    icon: '🦺',
    color: '#22C55E',
    subcategories: [
      { name: 'Eye Protection', slug: 'eye-protection', icon: '🥽' },
      { name: 'Gloves', slug: 'gloves', icon: '🧤' },
      { name: 'Respirators', slug: 'respirators', icon: '😷' },
      { name: 'Hearing Protection', slug: 'hearing-protection', icon: '🎧' },
      { name: 'First Aid', slug: 'first-aid', icon: '🩹' },
      { name: 'Fire Safety', slug: 'fire-safety', icon: '🧯' },
    ],
  },

  // Automotive
  {
    name: 'Automotive',
    slug: 'automotive',
    icon: '🚗',
    color: '#EF4444',
    subcategories: [
      { name: 'Fluids', slug: 'automotive-fluids', icon: '🛢️' },
      { name: 'Filters', slug: 'automotive-filters', icon: '🔲' },
      { name: 'Belts & Hoses', slug: 'belts-hoses', icon: '➰' },
      { name: 'Brakes', slug: 'brakes', icon: '🛑' },
      { name: 'Electrical Parts', slug: 'automotive-electrical', icon: '⚡' },
      { name: 'Body Parts', slug: 'body-parts', icon: '🚗' },
    ],
  },

  // Garden & Outdoor
  {
    name: 'Garden & Outdoor',
    slug: 'garden-outdoor',
    icon: '🌿',
    color: '#10B981',
    subcategories: [
      { name: 'Plants & Seeds', slug: 'plants-seeds', icon: '🌱' },
      { name: 'Soil & Fertilizer', slug: 'soil-fertilizer', icon: '🪴' },
      { name: 'Irrigation', slug: 'irrigation', icon: '💧' },
      { name: 'Outdoor Furniture', slug: 'outdoor-furniture', icon: '🪑' },
      { name: 'Lawn Care', slug: 'lawn-care', icon: '🌿' },
      { name: 'Pest Control', slug: 'pest-control', icon: '🐛' },
    ],
  },

  // Food & Pantry
  {
    name: 'Food & Pantry',
    slug: 'food-pantry',
    icon: '🍎',
    color: '#F97316',
    subcategories: [
      { name: 'Canned Goods', slug: 'canned-goods', icon: '🥫' },
      { name: 'Dry Goods', slug: 'dry-goods', icon: '🍚' },
      { name: 'Spices', slug: 'spices', icon: '🧂' },
      { name: 'Beverages', slug: 'beverages', icon: '🥤' },
      { name: 'Snacks', slug: 'snacks', icon: '🍪' },
      { name: 'Frozen', slug: 'frozen', icon: '🧊' },
    ],
  },

  // Household
  {
    name: 'Household',
    slug: 'household',
    icon: '🏠',
    color: '#06B6D4',
    subcategories: [
      { name: 'Cleaning Supplies', slug: 'cleaning-supplies', icon: '🧹' },
      { name: 'Paper Products', slug: 'paper-products', icon: '🧻' },
      { name: 'Laundry', slug: 'laundry', icon: '🧺' },
      { name: 'Kitchen Supplies', slug: 'kitchen-supplies', icon: '🍳' },
      { name: 'Storage & Organization', slug: 'storage-organization', icon: '📦' },
      { name: 'Air Fresheners', slug: 'air-fresheners', icon: '🌸' },
    ],
  },

  // Electronics
  {
    name: 'Electronics',
    slug: 'electronics',
    icon: '📱',
    color: '#6366F1',
    subcategories: [
      { name: 'Cables & Adapters', slug: 'cables-adapters', icon: '🔌' },
      { name: 'Computers & Parts', slug: 'computers-parts', icon: '💻' },
      { name: 'Audio/Video', slug: 'audio-video', icon: '🎧' },
      { name: 'Smart Home', slug: 'smart-home', icon: '🏠' },
      { name: 'Phones & Tablets', slug: 'phones-tablets', icon: '📱' },
      { name: 'Cameras', slug: 'cameras', icon: '📷' },
    ],
  },

  // Office Supplies
  {
    name: 'Office Supplies',
    slug: 'office-supplies',
    icon: '📎',
    color: '#64748B',
    subcategories: [
      { name: 'Paper & Notebooks', slug: 'paper-notebooks', icon: '📝' },
      { name: 'Writing Instruments', slug: 'writing-instruments', icon: '✏️' },
      { name: 'Filing & Storage', slug: 'filing-storage', icon: '📁' },
      { name: 'Desk Accessories', slug: 'desk-accessories', icon: '🖊️' },
      { name: 'Mailing Supplies', slug: 'mailing-supplies', icon: '📬' },
    ],
  },

  // Sports & Recreation
  {
    name: 'Sports & Recreation',
    slug: 'sports-recreation',
    icon: '⚽',
    color: '#EC4899',
    subcategories: [
      { name: 'Fitness Equipment', slug: 'fitness-equipment', icon: '🏋️' },
      { name: 'Outdoor Recreation', slug: 'outdoor-recreation', icon: '🏕️' },
      { name: 'Team Sports', slug: 'team-sports', icon: '⚽' },
      { name: 'Water Sports', slug: 'water-sports', icon: '🏊' },
      { name: 'Cycling', slug: 'cycling', icon: '🚴' },
    ],
  },

  // Other
  {
    name: 'Other',
    slug: 'other',
    icon: '📦',
    color: '#9CA3AF',
    subcategories: [
      { name: 'Miscellaneous', slug: 'miscellaneous', icon: '📦' },
      { name: 'Uncategorized', slug: 'uncategorized', icon: '❓' },
    ],
  },
];

/**
 * Seed categories into database
 * @param {Object} Category - Category model
 * @returns {Promise<void>}
 */
const seedCategories = async (Category) => {
  // Check if categories already exist
  const count = await Category.countDocuments({ isSystem: true });
  if (count > 0) {
    console.log(`Categories already seeded (${count} found). Skipping.`);
    return;
  }

  console.log('Seeding categories...');
  let totalCount = 0;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];

    // Create parent category
    const parent = await Category.create({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      color: cat.color,
      isSystem: true,
      sortOrder: i,
    });
    totalCount++;

    // Create subcategories
    if (cat.subcategories && cat.subcategories.length > 0) {
      for (let j = 0; j < cat.subcategories.length; j++) {
        const sub = cat.subcategories[j];
        await Category.create({
          name: sub.name,
          slug: sub.slug,
          icon: sub.icon || cat.icon,
          color: sub.color || cat.color,
          parentId: parent._id,
          isSystem: true,
          sortOrder: j,
        });
        totalCount++;
      }
    }
  }

  console.log(`Seeded ${totalCount} categories.`);
};

// Get all category data for reference
const getAllCategories = () => CATEGORIES;

// Get category by slug
const getCategoryBySlug = (slug) => {
  for (const cat of CATEGORIES) {
    if (cat.slug === slug) return cat;
    if (cat.subcategories) {
      const sub = cat.subcategories.find((s) => s.slug === slug);
      if (sub) return { ...sub, parent: cat };
    }
  }
  return null;
};

module.exports = {
  CATEGORIES,
  seedCategories,
  getAllCategories,
  getCategoryBySlug,
};
