-- Migration: Add Pregnancy & Baby Nutrition Tables
-- This creates the tables needed for the nutrition feature under Health & Wellness

-- ============================================================================
-- Nutrition Stages Table (admin-managed content for each stage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_stages (
  id SERIAL PRIMARY KEY,
  stage TEXT NOT NULL UNIQUE CHECK (stage IN ('pregnancy', 'breastfeeding', 'bottle-feeding', 'weaning')),
  title TEXT NOT NULL,
  intro_text TEXT NOT NULL,
  key_guidance JSONB NOT NULL DEFAULT '[]', -- Array of strings
  cheats_and_tips JSONB NOT NULL DEFAULT '[]', -- Array of strings
  linked_blog_tags JSONB DEFAULT '[]', -- Array of tag strings to pull related blogs
  safety_disclaimers JSONB DEFAULT '[]', -- Array of disclaimer strings
  seo_title TEXT,
  seo_description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for active stages ordered by display_order
CREATE INDEX IF NOT EXISTS idx_nutrition_stages_active ON nutrition_stages (is_active, display_order);

-- Add comment
COMMENT ON TABLE nutrition_stages IS 'Admin-managed content for pregnancy and baby nutrition stages';

-- ============================================================================
-- Nutrition Foods Table (curated foods for each stage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_foods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  stage_tags JSONB NOT NULL DEFAULT '[]', -- Array of stage strings this food applies to
  why_it_helps TEXT NOT NULL,
  allergens TEXT, -- Optional allergen/caution info
  nutrition_star_rating INTEGER NOT NULL CHECK (nutrition_star_rating >= 1 AND nutrition_star_rating <= 5),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for active foods
CREATE INDEX IF NOT EXISTS idx_nutrition_foods_active ON nutrition_foods (is_active, display_order);

-- Add GIN index for stage_tags array search
CREATE INDEX IF NOT EXISTS idx_nutrition_foods_stage_tags ON nutrition_foods USING GIN (stage_tags);

-- Add comment
COMMENT ON TABLE nutrition_foods IS 'Curated food suggestions for each nutrition stage with star ratings';

-- ============================================================================
-- Nutrition Equipment Table (equipment guidance for each stage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_equipment (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  stage_tags JSONB NOT NULL DEFAULT '[]', -- Array of stage strings this equipment applies to
  description TEXT NOT NULL, -- What it's used for
  buying_guidance TEXT NOT NULL, -- What to look for when buying
  affiliate_url TEXT, -- Optional affiliate link
  image_url TEXT, -- Optional product image
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for active equipment
CREATE INDEX IF NOT EXISTS idx_nutrition_equipment_active ON nutrition_equipment (is_active, display_order);

-- Add GIN index for stage_tags array search
CREATE INDEX IF NOT EXISTS idx_nutrition_equipment_stage_tags ON nutrition_equipment USING GIN (stage_tags);

-- Add comment
COMMENT ON TABLE nutrition_equipment IS 'Equipment suggestions and buying guidance for each nutrition stage';

-- ============================================================================
-- Insert default stage content (can be edited via admin)
-- ============================================================================

INSERT INTO nutrition_stages (stage, title, intro_text, key_guidance, cheats_and_tips, linked_blog_tags, safety_disclaimers, display_order) VALUES
(
  'pregnancy',
  'Nutrition During Pregnancy',
  'Eating well during pregnancy helps your baby develop and keeps you feeling your best. Focus on a balanced diet with plenty of variety, and don''t worry about eating for two – quality matters more than quantity.',
  '["Aim for 5 portions of fruit and vegetables daily", "Include protein at every meal (meat, fish, eggs, beans, lentils)", "Choose wholegrain carbohydrates for sustained energy", "Take folic acid (400mcg) until week 12, and vitamin D (10mcg) throughout", "Stay hydrated – aim for 6-8 glasses of water daily", "Avoid alcohol completely during pregnancy"]',
  '["Batch cook and freeze meals for the third trimester when energy dips", "Keep healthy snacks like nuts and fruit in your bag", "Ginger biscuits or lemon water can help with morning sickness", "Prep breakfast the night before to save time", "Frozen vegetables count towards your 5-a-day and are just as nutritious"]',
  '["pregnancy", "prenatal", "nutrition"]',
  '["Always consult your midwife or GP about supplements and dietary changes", "Avoid raw or undercooked eggs, meat, and fish", "Limit caffeine to 200mg per day (about 2 cups of coffee)", "Some cheeses and pâtés should be avoided – check NHS guidance"]',
  1
),
(
  'breastfeeding',
  'Nutrition While Breastfeeding',
  'Breastfeeding uses extra energy, so eating well helps maintain your milk supply and keeps your energy levels up. There''s no need for a special diet – just focus on balanced, nutritious meals.',
  '["Eat regular meals and healthy snacks to maintain energy", "Continue taking vitamin D (10mcg) daily", "Stay well hydrated – keep water nearby when feeding", "Include calcium-rich foods (dairy, fortified plant milks, leafy greens)", "Oily fish (salmon, sardines) twice a week supports baby''s brain development", "Most foods are fine – your baby gets used to flavours through your milk"]',
  '["Keep one-handed snacks ready for feeding sessions", "Prep a \"feeding station\" with water, snacks, and phone charger", "Overnight oats are quick and filling for early mornings", "Smoothies are an easy way to get nutrients when time is short", "Accept help with meal prep from family and friends"]',
  '["breastfeeding", "postnatal", "nutrition"]',
  '["Limit caffeine as it passes into breast milk", "Alcohol should be avoided or limited – time feeds accordingly", "Some babies may react to certain foods – keep a food diary if you notice issues", "Consult your GP before taking any supplements beyond vitamin D"]',
  2
),
(
  'bottle-feeding',
  'Bottle Feeding Guide',
  'Whether you''re using formula from the start or combining with breastfeeding, safe preparation and the right equipment make all the difference. Formula provides complete nutrition for your baby.',
  '["Use first infant formula for the first 12 months", "Always follow the manufacturer''s instructions exactly", "Make up feeds fresh when possible, or store safely in the fridge", "Never microwave formula – use a bottle warmer or warm water", "Hold your baby close during feeds for bonding", "Responsive feeding – watch for hunger and fullness cues"]',
  '["Invest in a prep machine for safer, faster night feeds", "Keep a bottle brush and steriliser near the sink", "Pre-measure powder into dispensers for night feeds", "Use ready-made formula for outings – no prep needed", "Warm bottles in a jug of hot water if no warmer available"]',
  '["bottle-feeding", "formula", "baby"]',
  '["Always use freshly boiled water cooled to 70°C to kill bacteria", "Discard any formula left after a feed", "Never add extra powder or water to formula", "Sterilise all equipment until baby is 12 months old", "Check the temperature on your wrist before feeding"]',
  3
),
(
  'weaning',
  'Weaning Your Baby',
  'Weaning is an exciting milestone! Starting around 6 months, your baby is ready to explore solid foods alongside milk feeds. Go at your baby''s pace and make mealtimes relaxed and enjoyable.',
  '["Start at around 6 months when baby shows signs of readiness", "Begin with single vegetables and fruits, then add variety", "Offer iron-rich foods early (meat, lentils, fortified cereals)", "Let baby explore textures – soft finger foods are great", "Continue milk feeds alongside solids until at least 12 months", "Introduce common allergens one at a time from 6 months"]',
  '["Ice cube trays are perfect for freezing purée portions", "Silicone bibs with a pocket catch mess brilliantly", "Offer water in an open cup from 6 months", "Messy mealtimes are normal – protect the floor with a splash mat", "Batch cook and freeze to save time", "Baby-led weaning and purées can be combined"]',
  '["weaning", "baby food", "first foods"]',
  '["Never leave baby alone while eating – choking is a risk", "Avoid honey until 12 months (botulism risk)", "Cut round foods (grapes, cherry tomatoes) lengthways", "No added salt or sugar for babies under 12 months", "Introduce allergens carefully and watch for reactions", "Consult your health visitor if you have concerns about feeding"]',
  4
)
ON CONFLICT (stage) DO UPDATE SET
  title = EXCLUDED.title,
  intro_text = EXCLUDED.intro_text,
  key_guidance = EXCLUDED.key_guidance,
  cheats_and_tips = EXCLUDED.cheats_and_tips,
  linked_blog_tags = EXCLUDED.linked_blog_tags,
  safety_disclaimers = EXCLUDED.safety_disclaimers,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================================================
-- Insert sample foods (admin can edit/add more)
-- ============================================================================

INSERT INTO nutrition_foods (name, stage_tags, why_it_helps, allergens, nutrition_star_rating, display_order) VALUES
-- Pregnancy foods
('Leafy Greens (Spinach, Kale)', '["pregnancy", "breastfeeding"]', 'Rich in folate, iron, and calcium – essential for baby''s development and your energy levels.', NULL, 5, 1),
('Salmon', '["pregnancy", "breastfeeding"]', 'Excellent source of omega-3 fatty acids (DHA) which support baby''s brain and eye development.', 'Fish', 5, 2),
('Eggs', '["pregnancy", "breastfeeding", "weaning"]', 'Complete protein with choline for brain development. Easy to prepare in many ways.', 'Eggs', 5, 3),
('Greek Yoghurt', '["pregnancy", "breastfeeding"]', 'High in protein and calcium. Probiotics support gut health.', 'Dairy', 4, 4),
('Sweet Potato', '["pregnancy", "breastfeeding", "weaning"]', 'Rich in beta-carotene (vitamin A), fibre, and slow-release energy.', NULL, 5, 5),
('Lentils', '["pregnancy", "breastfeeding", "weaning"]', 'Plant-based iron and protein. Great for vegetarians and budget-friendly.', NULL, 5, 6),
('Berries', '["pregnancy", "breastfeeding", "weaning"]', 'Packed with antioxidants, vitamin C, and fibre. Natural sweetness babies love.', NULL, 5, 7),
('Avocado', '["pregnancy", "breastfeeding", "weaning"]', 'Healthy fats for brain development. Creamy texture perfect for first foods.', NULL, 5, 8),
('Oats', '["pregnancy", "breastfeeding"]', 'Slow-release energy, fibre, and may help support milk supply.', 'Gluten (check if coeliac)', 4, 9),
('Lean Red Meat', '["pregnancy", "breastfeeding", "weaning"]', 'Best source of easily-absorbed iron. Important for preventing anaemia.', NULL, 4, 10),
-- Weaning-specific foods
('Banana', '["weaning"]', 'Naturally sweet, easy to mash, and a good source of potassium. Perfect first food.', NULL, 4, 11),
('Broccoli', '["weaning"]', 'Iron, vitamin C, and easy to hold as a finger food. The "trees" appeal to babies!', NULL, 5, 12),
('Chicken', '["weaning"]', 'Soft-cooked chicken provides protein and iron. Shred or offer as strips.', NULL, 4, 13),
('Nut Butters (smooth)', '["weaning"]', 'Good way to introduce nut allergens. Mix into porridge or spread thinly.', 'Tree nuts, Peanuts', 4, 14),
('Full-Fat Cheese', '["weaning"]', 'Calcium and protein in a form babies can hold. Choose low-salt varieties.', 'Dairy', 4, 15)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Insert sample equipment (admin can edit/add more)
-- ============================================================================

INSERT INTO nutrition_equipment (name, stage_tags, description, buying_guidance, affiliate_url, display_order) VALUES
-- Bottle feeding equipment
('Steriliser', '["bottle-feeding"]', 'Kills bacteria on bottles, teats, and breast pump parts. Essential for safe feeding.', 'Choose electric steam sterilisers for convenience, or cold water sterilising tablets for travel. Look for capacity to fit your bottle brand.', NULL, 1),
('Formula Prep Machine', '["bottle-feeding"]', 'Dispenses water at the correct temperature (70°C) for safe formula preparation. Speeds up night feeds.', 'Check it''s compatible with your formula brand. Look for adjustable volume settings and easy cleaning.', NULL, 2),
('Bottles', '["bottle-feeding"]', 'Hold formula or expressed milk. Various shapes and flow rates available.', 'Start with slow-flow teats for newborns. Anti-colic bottles may help with wind. Buy 4-6 to start.', NULL, 3),
('Bottle Brush', '["bottle-feeding"]', 'Cleans inside bottles and teats thoroughly. Essential for hygiene.', 'Look for brushes with a teat cleaner attached. Silicone brushes are durable and hygienic.', NULL, 4),
('Insulated Bottle Bag', '["bottle-feeding"]', 'Keeps prepared bottles cool when out and about, or keeps water warm for making feeds.', 'Check it fits your bottle brand. Some include ice packs or have thermal lining.', NULL, 5),
-- Weaning equipment
('Highchair', '["weaning"]', 'Safe, supportive seat for mealtimes. Keeps baby secure while eating.', 'Look for easy-clean surfaces, a secure harness, and adjustable height. Footrest support is important.', NULL, 6),
('Silicone Bibs', '["weaning"]', 'Catch-pocket bibs reduce mess and are easy to wipe clean. More sustainable than disposables.', 'Soft silicone is comfortable. Look for adjustable neck sizes and deep pockets.', NULL, 7),
('Suction Bowls', '["weaning"]', 'Stick to the highchair tray so baby can''t throw them. Reduces mess and frustration.', 'Strong suction is key. Divided sections help with portion sizes. BPA-free silicone is safest.', NULL, 8),
('Weaning Spoons', '["weaning"]', 'Soft-tipped spoons are gentle on baby''s gums. Shallow bowl makes eating easier.', 'Silicone tips are best for sensitive gums. Look for ergonomic handles for self-feeding.', NULL, 9),
('Splash Mat', '["weaning"]', 'Protects your floor during messy mealtimes. Makes cleanup much easier.', 'Waterproof and wipeable is essential. Large size covers more mess. Machine washable is a bonus.', NULL, 10),
('Food Processor/Blender', '["weaning"]', 'Makes smooth purées for early weaning. Can also make family meals baby-friendly.', 'A small hand blender is often enough. Look for easy cleaning and dishwasher-safe parts.', NULL, 11),
('Ice Cube Trays', '["weaning"]', 'Perfect for freezing purée portions. Pop out one cube at a time for quick meals.', 'Silicone trays release cubes easily. Lids prevent freezer burn. Standard size = roughly 1oz portions.', NULL, 12),
('Open Cup', '["weaning"]', 'Teaches drinking skills from 6 months. Better for oral development than sippy cups.', 'Small, lightweight cups are easiest. Doidy cups have an angled rim for easier drinking.', NULL, 13)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE nutrition_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_equipment ENABLE ROW LEVEL SECURITY;

-- Public read access for active content
CREATE POLICY "Public can read active nutrition stages"
  ON nutrition_stages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read active nutrition foods"
  ON nutrition_foods FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read active nutrition equipment"
  ON nutrition_equipment FOR SELECT
  USING (is_active = true);

-- Service role has full access (for admin operations)
CREATE POLICY "Service role has full access to nutrition_stages"
  ON nutrition_stages FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to nutrition_foods"
  ON nutrition_foods FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to nutrition_equipment"
  ON nutrition_equipment FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

