import { RecipesSeeder } from '../../core/admin/admin.seeder';
import { IngredientsSeeder } from '../../core/ingredients/ingredients.seeder';
import { RolesSeeder } from '../../core/roles/roles.seeder';

export const allSeeder = [RolesSeeder, IngredientsSeeder, RecipesSeeder];
