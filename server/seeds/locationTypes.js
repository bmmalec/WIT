/**
 * Location Types Seed Data
 * Pre-defined location types with icons and default colors
 */

const LOCATION_TYPES = {
  // Properties - top-level locations
  property: [
    { value: 'house', label: 'House', icon: '🏠', color: '#3B82F6' },
    { value: 'apartment', label: 'Apartment', icon: '🏢', color: '#6366F1' },
    { value: 'warehouse', label: 'Warehouse', icon: '🏭', color: '#8B5CF6' },
    { value: 'storage_unit', label: 'Storage Unit', icon: '📦', color: '#A855F7' },
    { value: 'office', label: 'Office', icon: '🏢', color: '#EC4899' },
    { value: 'vehicle', label: 'Vehicle', icon: '🚗', color: '#F43F5E' },
    { value: 'boat', label: 'Boat', icon: '⛵', color: '#0EA5E9' },
    { value: 'rv', label: 'RV/Camper', icon: '🚐', color: '#14B8A6' },
  ],

  // Rooms - inside properties
  room: [
    { value: 'garage', label: 'Garage', icon: '🚙', color: '#64748B' },
    { value: 'basement', label: 'Basement', icon: '🪜', color: '#475569' },
    { value: 'attic', label: 'Attic', icon: '🏚️', color: '#78716C' },
    { value: 'kitchen', label: 'Kitchen', icon: '🍳', color: '#F97316' },
    { value: 'bedroom', label: 'Bedroom', icon: '🛏️', color: '#8B5CF6' },
    { value: 'bathroom', label: 'Bathroom', icon: '🚿', color: '##0EA5E9' },
    { value: 'living_room', label: 'Living Room', icon: '🛋️', color: '#10B981' },
    { value: 'dining_room', label: 'Dining Room', icon: '🍽️', color: '#F59E0B' },
    { value: 'office_room', label: 'Home Office', icon: '💻', color: '#6366F1' },
    { value: 'laundry', label: 'Laundry Room', icon: '🧺', color: '#06B6D4' },
    { value: 'workshop', label: 'Workshop', icon: '🔧', color: '#EF4444' },
    { value: 'utility', label: 'Utility Room', icon: '🔌', color: '#64748B' },
    { value: 'room', label: 'Other Room', icon: '🚪', color: '#94A3B8' },
  ],

  // Warehouse zones - for warehouse/industrial locations
  zone: [
    { value: 'zone', label: 'Zone', icon: '📍', color: '#3B82F6' },
    { value: 'inbound', label: 'Inbound', icon: '📥', color: '#22C55E' },
    { value: 'outbound', label: 'Outbound', icon: '📤', color: '#EF4444' },
    { value: 'staging', label: 'Staging', icon: '⏳', color: '#F59E0B' },
    { value: 'receiving', label: 'Receiving', icon: '📬', color: '#10B981' },
    { value: 'shipping', label: 'Shipping', icon: '🚚', color: '#F97316' },
    { value: 'racking', label: 'Racking', icon: '🏗️', color: '#8B5CF6' },
    { value: 'floor', label: 'Floor Area', icon: '⬜', color: '#64748B' },
    { value: 'aisle', label: 'Aisle', icon: '↔️', color: '#06B6D4' },
  ],

  // Containers - storage containers
  container: [
    { value: 'closet', label: 'Closet', icon: '🚪', color: '#8B5CF6' },
    { value: 'cabinet', label: 'Cabinet', icon: '🗄️', color: '#64748B' },
    { value: 'drawer', label: 'Drawer', icon: '🗃️', color: '#78716C' },
    { value: 'shelf', label: 'Shelf', icon: '📚', color: '#A855F7' },
    { value: 'box', label: 'Box', icon: '📦', color: '#F59E0B' },
    { value: 'bin', label: 'Bin', icon: '🗑️', color: '#10B981' },
    { value: 'container', label: 'Container', icon: '📥', color: '#3B82F6' },
    { value: 'drawer_cabinet', label: 'Drawer Cabinet', icon: '🗄️', color: '#6366F1' },
    { value: 'shelving', label: 'Shelving Unit', icon: '📚', color: '#8B5CF6' },
    { value: 'bin_rack', label: 'Bin Rack', icon: '🗃️', color: '#22C55E' },
    { value: 'tool_chest', label: 'Tool Chest', icon: '🧰', color: '#EF4444' },
    { value: 'pegboard', label: 'Pegboard', icon: '📌', color: '#F97316' },
    { value: 'locker', label: 'Locker', icon: '🔐', color: '#0EA5E9' },
    { value: 'safe', label: 'Safe', icon: '🔒', color: '#1F2937' },
    { value: 'trunk', label: 'Trunk', icon: '📦', color: '#78716C' },
    { value: 'crate', label: 'Crate', icon: '📦', color: '#A16207' },
    { value: 'pallet', label: 'Pallet', icon: '🪵', color: '#92400E' },
  ],

  // Other/Custom
  other: [
    { value: 'custom', label: 'Custom', icon: '✏️', color: '#6B7280' },
  ],
};

// Flat list of all types for validation
const ALL_LOCATION_TYPES = Object.values(LOCATION_TYPES).flat();

// Get all type values for validation
const getTypeValues = () => ALL_LOCATION_TYPES.map(t => t.value);

// Get type info by value
const getTypeInfo = (value) => ALL_LOCATION_TYPES.find(t => t.value === value);

// Get types by category
const getTypesByCategory = (category) => LOCATION_TYPES[category] || [];

// Check if type is a container type
const isContainerType = (value) => {
  const containerValues = LOCATION_TYPES.container.map(t => t.value);
  containerValues.push('storage_unit'); // Also include storage_unit
  return containerValues.includes(value);
};

module.exports = {
  LOCATION_TYPES,
  ALL_LOCATION_TYPES,
  getTypeValues,
  getTypeInfo,
  getTypesByCategory,
  isContainerType,
};
