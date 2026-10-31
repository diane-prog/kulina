import { CuisinesSeeder } from '../../core/cuisines/cuisines.seeder';
import { IngredientsSeeder } from '../../core/ingredients/ingredients.seeder';
import { RecipeCategoriesSeeder } from '../../core/recipe-categories/recipe-categories.seeder';
import { RolesSeeder } from '../../core/roles/roles.seeder';

export const allSeeder = [
    RolesSeeder,
    CuisinesSeeder,
    RecipeCategoriesSeeder,
    IngredientsSeeder,
];
