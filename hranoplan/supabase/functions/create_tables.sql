-- Function to create recipes table
CREATE OR REPLACE FUNCTION create_recipes_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    ingredients JSONB NOT NULL,
    instructions TEXT[] NOT NULL,
    prep_time INTEGER,
    cook_time INTEGER,
    servings INTEGER,
    image_url TEXT,
    tags TEXT[],
    is_snack BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create meal_plans table
CREATE OR REPLACE FUNCTION create_meal_plans_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create meal_plan_recipes table
CREATE OR REPLACE FUNCTION create_meal_plan_recipes_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS meal_plan_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0-6 for Sunday-Saturday
    meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(meal_plan_id, recipe_id, day_of_week, meal_type)
  );
END;
$$ LANGUAGE plpgsql; 