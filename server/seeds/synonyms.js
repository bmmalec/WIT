/**
 * Synonym Seed Data
 * 100+ synonym groups for common inventory items
 * Run with: node server/seeds/synonyms.js
 */

const mongoose = require('mongoose');
const Synonym = require('../models/Synonym');
require('dotenv').config();

// Synonym groups organized by category
const synonymData = [
  // ===== TOOLS =====
  { canonicalName: 'wrench', synonyms: ['spanner', 'adjustable wrench', 'crescent wrench', 'pipe wrench'], category: 'tools' },
  { canonicalName: 'pliers', synonyms: ['grips', 'needle-nose', 'needle nose pliers', 'lineman pliers', 'channel locks', 'slip joint pliers'], category: 'tools' },
  { canonicalName: 'screwdriver', synonyms: ['driver', 'phillips', 'phillips head', 'flathead', 'flat head', 'slotted'], category: 'tools' },
  { canonicalName: 'hammer', synonyms: ['mallet', 'sledge', 'sledgehammer', 'claw hammer', 'ball peen', 'ball pein'], category: 'tools' },
  { canonicalName: 'saw', synonyms: ['handsaw', 'hacksaw', 'hand saw', 'circular saw', 'jigsaw', 'reciprocating saw', 'sawzall'], category: 'tools' },
  { canonicalName: 'drill', synonyms: ['power drill', 'cordless drill', 'driver', 'impact driver', 'hammer drill', 'drill driver'], category: 'tools' },
  { canonicalName: 'level', synonyms: ['spirit level', 'bubble level', 'laser level', 'torpedo level'], category: 'tools' },
  { canonicalName: 'tape measure', synonyms: ['measuring tape', 'tape', 'ruler', 'measure'], category: 'tools' },
  { canonicalName: 'utility knife', synonyms: ['box cutter', 'razor knife', 'stanley knife', 'exacto knife', 'x-acto'], category: 'tools' },
  { canonicalName: 'socket set', synonyms: ['socket wrench', 'ratchet set', 'ratchet', 'socket', 'sockets'], category: 'tools' },
  { canonicalName: 'allen wrench', synonyms: ['hex key', 'allen key', 'hex wrench', 'l-key'], category: 'tools' },
  { canonicalName: 'pry bar', synonyms: ['crowbar', 'crow bar', 'wrecking bar', 'jimmy bar', 'nail puller'], category: 'tools' },
  { canonicalName: 'chisel', synonyms: ['wood chisel', 'cold chisel', 'masonry chisel'], category: 'tools' },
  { canonicalName: 'file', synonyms: ['rasp', 'metal file', 'wood file', 'bastard file'], category: 'tools' },
  { canonicalName: 'clamp', synonyms: ['c-clamp', 'c clamp', 'bar clamp', 'pipe clamp', 'spring clamp', 'vise grip'], category: 'tools' },
  { canonicalName: 'vise', synonyms: ['vice', 'bench vise', 'bench vice', 'woodworking vise'], category: 'tools' },
  { canonicalName: 'sander', synonyms: ['orbital sander', 'belt sander', 'palm sander', 'random orbit sander'], category: 'tools' },
  { canonicalName: 'grinder', synonyms: ['angle grinder', 'bench grinder', 'die grinder', 'disc grinder'], category: 'tools' },
  { canonicalName: 'router', synonyms: ['wood router', 'palm router', 'plunge router', 'trim router'], category: 'tools' },
  { canonicalName: 'plane', synonyms: ['hand plane', 'block plane', 'jack plane', 'smoothing plane'], category: 'tools' },
  { canonicalName: 'square', synonyms: ['framing square', 'speed square', 'combination square', 'try square', 'carpenter square'], category: 'tools' },

  // ===== HARDWARE =====
  { canonicalName: 'screw', synonyms: ['wood screw', 'machine screw', 'drywall screw', 'deck screw', 'lag screw'], category: 'hardware' },
  { canonicalName: 'bolt', synonyms: ['machine bolt', 'carriage bolt', 'hex bolt', 'lag bolt', 'anchor bolt'], category: 'hardware' },
  { canonicalName: 'nail', synonyms: ['brad', 'tack', 'finishing nail', 'common nail', 'framing nail', 'brad nail'], category: 'hardware' },
  { canonicalName: 'nut', synonyms: ['hex nut', 'lock nut', 'wing nut', 'cap nut', 'coupling nut'], category: 'hardware' },
  { canonicalName: 'washer', synonyms: ['flat washer', 'lock washer', 'fender washer', 'spacer'], category: 'hardware' },
  { canonicalName: 'bracket', synonyms: ['brace', 'angle bracket', 'corner bracket', 'shelf bracket', 'l-bracket'], category: 'hardware' },
  { canonicalName: 'hinge', synonyms: ['door hinge', 'cabinet hinge', 'piano hinge', 'butt hinge', 'strap hinge'], category: 'hardware' },
  { canonicalName: 'hook', synonyms: ['cup hook', 'ceiling hook', 's-hook', 'j-hook', 'coat hook'], category: 'hardware' },
  { canonicalName: 'anchor', synonyms: ['wall anchor', 'drywall anchor', 'toggle bolt', 'molly bolt', 'expansion anchor'], category: 'hardware' },
  { canonicalName: 'chain', synonyms: ['link chain', 'proof chain', 'jack chain'], category: 'hardware' },
  { canonicalName: 'cable', synonyms: ['wire cable', 'steel cable', 'aircraft cable'], category: 'hardware' },
  { canonicalName: 'rope', synonyms: ['cord', 'twine', 'string', 'paracord', 'nylon rope', 'manila rope'], category: 'hardware' },

  // ===== PLUMBING =====
  { canonicalName: 'pipe', synonyms: ['tubing', 'tube', 'pvc pipe', 'copper pipe', 'pex'], category: 'plumbing' },
  { canonicalName: 'fitting', synonyms: ['pipe fitting', 'connector', 'coupling', 'adapter', 'reducer'], category: 'plumbing' },
  { canonicalName: 'elbow', synonyms: ['90 degree elbow', '45 degree elbow', 'pipe elbow', 'street elbow'], category: 'plumbing' },
  { canonicalName: 'tee', synonyms: ['t-fitting', 'pipe tee', 'tee fitting'], category: 'plumbing' },
  { canonicalName: 'valve', synonyms: ['shutoff valve', 'ball valve', 'gate valve', 'check valve', 'stop valve'], category: 'plumbing' },
  { canonicalName: 'faucet', synonyms: ['tap', 'spigot', 'kitchen faucet', 'bathroom faucet', 'sink faucet'], category: 'plumbing' },
  { canonicalName: 'washer', synonyms: ['faucet washer', 'hose washer', 'rubber washer', 'o-ring'], category: 'plumbing' },
  { canonicalName: 'tape', synonyms: ['teflon tape', 'plumber tape', 'thread tape', 'ptfe tape'], category: 'plumbing' },
  { canonicalName: 'plunger', synonyms: ['toilet plunger', 'sink plunger', 'cup plunger', 'flange plunger'], category: 'plumbing' },
  { canonicalName: 'snake', synonyms: ['drain snake', 'auger', 'drain auger', 'plumber snake'], category: 'plumbing' },

  // ===== ELECTRICAL =====
  { canonicalName: 'wire', synonyms: ['electrical wire', 'romex', 'cable', 'conductor', 'wiring'], category: 'electrical' },
  { canonicalName: 'outlet', synonyms: ['receptacle', 'plug', 'socket', 'electrical outlet', 'power outlet'], category: 'electrical' },
  { canonicalName: 'switch', synonyms: ['light switch', 'toggle switch', 'dimmer', 'dimmer switch', 'wall switch'], category: 'electrical' },
  { canonicalName: 'breaker', synonyms: ['circuit breaker', 'fuse', 'gfci', 'gfi', 'ground fault'], category: 'electrical' },
  { canonicalName: 'wire nut', synonyms: ['wire connector', 'marrette', 'twist connector', 'wire cap'], category: 'electrical' },
  { canonicalName: 'junction box', synonyms: ['j-box', 'electrical box', 'outlet box', 'switch box'], category: 'electrical' },
  { canonicalName: 'conduit', synonyms: ['emt', 'electrical conduit', 'pvc conduit', 'flexible conduit'], category: 'electrical' },
  { canonicalName: 'bulb', synonyms: ['light bulb', 'lamp', 'led bulb', 'incandescent', 'cfl'], category: 'electrical' },
  { canonicalName: 'battery', synonyms: ['batteries', 'cell', 'rechargeable', 'alkaline'], category: 'electrical' },
  { canonicalName: 'extension cord', synonyms: ['power cord', 'drop cord', 'extension', 'power strip'], category: 'electrical' },

  // ===== PAINT & FINISHES =====
  { canonicalName: 'paint', synonyms: ['latex paint', 'acrylic paint', 'oil paint', 'enamel', 'primer'], category: 'paint' },
  { canonicalName: 'brush', synonyms: ['paint brush', 'paintbrush', 'bristle brush', 'chip brush'], category: 'paint' },
  { canonicalName: 'roller', synonyms: ['paint roller', 'roller cover', 'nap roller', 'foam roller'], category: 'paint' },
  { canonicalName: 'tape', synonyms: ['painter tape', 'masking tape', 'blue tape', 'frog tape'], category: 'paint' },
  { canonicalName: 'caulk', synonyms: ['caulking', 'sealant', 'silicone', 'latex caulk', 'acrylic caulk'], category: 'paint' },
  { canonicalName: 'stain', synonyms: ['wood stain', 'deck stain', 'gel stain', 'penetrating stain'], category: 'paint' },
  { canonicalName: 'varnish', synonyms: ['polyurethane', 'poly', 'lacquer', 'shellac', 'finish', 'clear coat'], category: 'paint' },
  { canonicalName: 'sandpaper', synonyms: ['sanding paper', 'emery paper', 'abrasive paper', 'grit paper'], category: 'paint' },
  { canonicalName: 'putty', synonyms: ['wood putty', 'wood filler', 'spackle', 'spackling', 'filler'], category: 'paint' },
  { canonicalName: 'thinner', synonyms: ['paint thinner', 'mineral spirits', 'turpentine', 'solvent', 'acetone'], category: 'paint' },

  // ===== BUILDING MATERIALS =====
  { canonicalName: 'lumber', synonyms: ['wood', 'timber', 'boards', 'planks', 'dimensional lumber', '2x4'], category: 'building' },
  { canonicalName: 'plywood', synonyms: ['ply', 'sheathing', 'osb', 'particle board', 'mdf'], category: 'building' },
  { canonicalName: 'drywall', synonyms: ['sheetrock', 'gypsum board', 'wallboard', 'plasterboard'], category: 'building' },
  { canonicalName: 'insulation', synonyms: ['fiberglass', 'foam board', 'spray foam', 'batt insulation', 'r-value'], category: 'building' },
  { canonicalName: 'concrete', synonyms: ['cement', 'mortar', 'grout', 'quickcrete', 'sakrete'], category: 'building' },
  { canonicalName: 'rebar', synonyms: ['reinforcing bar', 'reinforcement', 'steel bar'], category: 'building' },
  { canonicalName: 'flashing', synonyms: ['roof flashing', 'drip edge', 'step flashing'], category: 'building' },
  { canonicalName: 'shingle', synonyms: ['roofing shingle', 'asphalt shingle', 'roof tile'], category: 'building' },
  { canonicalName: 'siding', synonyms: ['vinyl siding', 'aluminum siding', 'clapboard', 'lap siding'], category: 'building' },
  { canonicalName: 'trim', synonyms: ['molding', 'moulding', 'baseboard', 'crown molding', 'casing'], category: 'building' },

  // ===== AUTOMOTIVE =====
  { canonicalName: 'oil', synonyms: ['motor oil', 'engine oil', 'synthetic oil', '5w30', '10w30'], category: 'automotive' },
  { canonicalName: 'filter', synonyms: ['oil filter', 'air filter', 'cabin filter', 'fuel filter'], category: 'automotive' },
  { canonicalName: 'brake pad', synonyms: ['brake pads', 'brakes', 'disc brake pad', 'brake shoe'], category: 'automotive' },
  { canonicalName: 'spark plug', synonyms: ['plug', 'ignition plug', 'spark plugs'], category: 'automotive' },
  { canonicalName: 'wiper', synonyms: ['wiper blade', 'windshield wiper', 'wiper blades'], category: 'automotive' },
  { canonicalName: 'coolant', synonyms: ['antifreeze', 'radiator fluid', 'engine coolant'], category: 'automotive' },
  { canonicalName: 'transmission fluid', synonyms: ['atf', 'trans fluid', 'gear oil', 'transmission oil'], category: 'automotive' },
  { canonicalName: 'headlight', synonyms: ['headlamp', 'head light', 'bulb', 'h11', 'h7', '9005'], category: 'automotive' },
  { canonicalName: 'fuse', synonyms: ['auto fuse', 'blade fuse', 'car fuse'], category: 'automotive' },
  { canonicalName: 'jumper cables', synonyms: ['jumper cable', 'booster cables', 'jump leads'], category: 'automotive' },

  // ===== GARDEN & OUTDOOR =====
  { canonicalName: 'shovel', synonyms: ['spade', 'digging shovel', 'garden spade', 'trenching shovel'], category: 'garden' },
  { canonicalName: 'rake', synonyms: ['leaf rake', 'garden rake', 'bow rake', 'thatch rake'], category: 'garden' },
  { canonicalName: 'hoe', synonyms: ['garden hoe', 'stirrup hoe', 'dutch hoe', 'warren hoe'], category: 'garden' },
  { canonicalName: 'trowel', synonyms: ['hand trowel', 'garden trowel', 'transplanting trowel'], category: 'garden' },
  { canonicalName: 'pruner', synonyms: ['pruning shears', 'secateurs', 'clippers', 'hand pruner', 'loppers'], category: 'garden' },
  { canonicalName: 'hose', synonyms: ['garden hose', 'water hose', 'soaker hose', 'sprinkler hose'], category: 'garden' },
  { canonicalName: 'sprinkler', synonyms: ['lawn sprinkler', 'oscillating sprinkler', 'impact sprinkler'], category: 'garden' },
  { canonicalName: 'fertilizer', synonyms: ['plant food', 'compost', 'manure', 'mulch', 'soil amendment'], category: 'garden' },
  { canonicalName: 'weed killer', synonyms: ['herbicide', 'roundup', 'weed control', 'weed spray'], category: 'garden' },
  { canonicalName: 'insecticide', synonyms: ['bug spray', 'pesticide', 'pest control', 'insect killer'], category: 'garden' },

  // ===== FOOD & PANTRY =====
  { canonicalName: 'soda', synonyms: ['pop', 'cola', 'soft drink', 'coke', 'carbonated drink'], category: 'food' },
  { canonicalName: 'chips', synonyms: ['crisps', 'potato chips', 'tortilla chips', 'snack chips'], category: 'food' },
  { canonicalName: 'pasta', synonyms: ['noodles', 'spaghetti', 'macaroni', 'penne', 'fettuccine'], category: 'food' },
  { canonicalName: 'sauce', synonyms: ['pasta sauce', 'marinara', 'tomato sauce', 'red sauce'], category: 'food' },
  { canonicalName: 'rice', synonyms: ['white rice', 'brown rice', 'jasmine rice', 'basmati'], category: 'food' },
  { canonicalName: 'beans', synonyms: ['canned beans', 'black beans', 'pinto beans', 'kidney beans'], category: 'food' },
  { canonicalName: 'soup', synonyms: ['broth', 'stock', 'canned soup', 'bouillon'], category: 'food' },
  { canonicalName: 'cereal', synonyms: ['breakfast cereal', 'oatmeal', 'granola', 'corn flakes'], category: 'food' },
  { canonicalName: 'bread', synonyms: ['loaf', 'sliced bread', 'baguette', 'rolls'], category: 'food' },
  { canonicalName: 'flour', synonyms: ['all-purpose flour', 'wheat flour', 'bread flour', 'self-rising'], category: 'food' },
  { canonicalName: 'sugar', synonyms: ['granulated sugar', 'white sugar', 'brown sugar', 'powdered sugar'], category: 'food' },
  { canonicalName: 'butter', synonyms: ['margarine', 'spread', 'salted butter', 'unsalted butter'], category: 'food' },
  { canonicalName: 'milk', synonyms: ['whole milk', '2% milk', 'skim milk', 'dairy'], category: 'food' },
  { canonicalName: 'cheese', synonyms: ['cheddar', 'american cheese', 'swiss', 'mozzarella', 'parmesan'], category: 'food' },
  { canonicalName: 'eggs', synonyms: ['egg', 'dozen eggs', 'large eggs'], category: 'food' },

  // ===== HOUSEHOLD =====
  { canonicalName: 'trash bags', synonyms: ['garbage bags', 'bin liners', 'refuse bags', 'waste bags'], category: 'household' },
  { canonicalName: 'paper towels', synonyms: ['paper towel', 'kitchen roll', 'kitchen towels'], category: 'household' },
  { canonicalName: 'toilet paper', synonyms: ['tp', 'toilet tissue', 'bath tissue', 'bathroom tissue'], category: 'household' },
  { canonicalName: 'detergent', synonyms: ['laundry detergent', 'laundry soap', 'washing powder', 'dish soap'], category: 'household' },
  { canonicalName: 'bleach', synonyms: ['chlorine bleach', 'clorox', 'disinfectant'], category: 'household' },
  { canonicalName: 'cleaner', synonyms: ['all-purpose cleaner', 'surface cleaner', 'cleaning spray', 'windex'], category: 'household' },
  { canonicalName: 'sponge', synonyms: ['scrubber', 'dish sponge', 'scrub brush', 'scouring pad'], category: 'household' },
  { canonicalName: 'mop', synonyms: ['floor mop', 'swiffer', 'wet mop', 'string mop'], category: 'household' },
  { canonicalName: 'broom', synonyms: ['push broom', 'corn broom', 'angle broom'], category: 'household' },
  { canonicalName: 'vacuum', synonyms: ['vacuum cleaner', 'hoover', 'shop vac', 'upright vacuum'], category: 'household' },

  // ===== OFFICE =====
  { canonicalName: 'pen', synonyms: ['ballpoint', 'ink pen', 'writing pen', 'bic'], category: 'office' },
  { canonicalName: 'pencil', synonyms: ['mechanical pencil', 'lead pencil', 'graphite pencil'], category: 'office' },
  { canonicalName: 'marker', synonyms: ['sharpie', 'highlighter', 'felt tip', 'permanent marker'], category: 'office' },
  { canonicalName: 'tape', synonyms: ['scotch tape', 'clear tape', 'packing tape', 'masking tape'], category: 'office' },
  { canonicalName: 'stapler', synonyms: ['staple gun', 'staples', 'desk stapler'], category: 'office' },
  { canonicalName: 'scissors', synonyms: ['shears', 'cutting scissors', 'paper scissors'], category: 'office' },
  { canonicalName: 'paper', synonyms: ['copy paper', 'printer paper', 'notebook', 'notepad'], category: 'office' },
  { canonicalName: 'folder', synonyms: ['file folder', 'manila folder', 'binder', 'portfolio'], category: 'office' },
  { canonicalName: 'envelope', synonyms: ['mailer', 'mailing envelope', 'letter envelope'], category: 'office' },
  { canonicalName: 'clip', synonyms: ['paper clip', 'binder clip', 'bulldog clip', 'clamp'], category: 'office' },

  // ===== SAFETY & PPE =====
  { canonicalName: 'gloves', synonyms: ['work gloves', 'latex gloves', 'nitrile gloves', 'safety gloves'], category: 'safety' },
  { canonicalName: 'goggles', synonyms: ['safety glasses', 'eye protection', 'protective eyewear'], category: 'safety' },
  { canonicalName: 'mask', synonyms: ['dust mask', 'respirator', 'n95', 'face mask', 'breathing mask'], category: 'safety' },
  { canonicalName: 'earplugs', synonyms: ['ear plugs', 'ear protection', 'ear muffs', 'hearing protection'], category: 'safety' },
  { canonicalName: 'hard hat', synonyms: ['helmet', 'safety helmet', 'bump cap', 'head protection'], category: 'safety' },
  { canonicalName: 'vest', synonyms: ['safety vest', 'hi-vis vest', 'reflective vest', 'high visibility'], category: 'safety' },
  { canonicalName: 'first aid kit', synonyms: ['first aid', 'medical kit', 'emergency kit'], category: 'safety' },
  { canonicalName: 'fire extinguisher', synonyms: ['extinguisher', 'abc extinguisher'], category: 'safety' },
];

/**
 * Seed the database with synonyms
 */
async function seedSynonyms() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wit';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing system synonyms
    const deleteResult = await Synonym.deleteMany({ isSystem: true });
    console.log(`Cleared ${deleteResult.deletedCount} existing system synonyms`);

    // Insert new synonyms
    const docs = synonymData.map(item => ({
      ...item,
      isSystem: true,
      isActive: true,
    }));

    const result = await Synonym.insertMany(docs);
    console.log(`Inserted ${result.length} synonym groups`);

    // Count total synonyms
    const totalSynonyms = synonymData.reduce((sum, item) => sum + item.synonyms.length, 0);
    console.log(`Total synonym terms: ${totalSynonyms + synonymData.length}`);

    // Show category breakdown
    const categories = {};
    for (const item of synonymData) {
      categories[item.category] = (categories[item.category] || 0) + 1;
    }
    console.log('\nBy category:');
    for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: ${count} groups`);
    }

    console.log('\nSynonym seeding complete!');
  } catch (error) {
    console.error('Error seeding synonyms:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  seedSynonyms();
}

module.exports = { synonymData, seedSynonyms };
