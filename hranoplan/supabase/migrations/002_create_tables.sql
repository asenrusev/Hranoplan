-- Drop existing triggers and tables
DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON meal_plans;
DROP TABLE IF EXISTS meal_plan_recipes;
DROP TABLE IF EXISTS meal_plans;
DROP TABLE IF EXISTS recipes;

-- Create recipes table
CREATE TABLE recipes (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create meal_plans table
CREATE TABLE meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    prepTime INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create meal_plan_recipes table
CREATE TABLE meal_plan_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0-6 for Sunday-Saturday
    meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(meal_plan_id, recipe_id, day_of_week, meal_type)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at
    BEFORE UPDATE ON meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 