export interface SqliteMigration {
  id: string;
  sql: string;
}

export const sqliteMigrations: SqliteMigration[] = [
  {
    id: '20260103201139_InitialCreate',
    sql: `
      CREATE TABLE IF NOT EXISTS "Products" (
        "Id" TEXT NOT NULL PRIMARY KEY,
        "Name" TEXT NOT NULL,
        "Price" REAL NOT NULL,
        "Quantity" REAL NOT NULL,
        "UnitOfMeasure" INTEGER NOT NULL,
        "CreatedAt" TEXT NOT NULL,
        "UpdatedAt" TEXT NOT NULL,
        "IsDeleted" INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS "Packings" (
        "Id" TEXT NOT NULL PRIMARY KEY,
        "Name" TEXT NOT NULL,
        "Description" TEXT NULL,
        "Price" REAL NOT NULL,
        "Quantity" REAL NOT NULL,
        "UnitOfMeasure" INTEGER NOT NULL,
        "CreatedAt" TEXT NOT NULL,
        "UpdatedAt" TEXT NOT NULL,
        "IsDeleted" INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS "Recipes" (
        "Id" TEXT NOT NULL PRIMARY KEY,
        "Name" TEXT NOT NULL,
        "Description" TEXT NULL,
        "Quantity" REAL NULL,
        "SellingValue" REAL NULL,
        "TotalCost" REAL NOT NULL DEFAULT 0,
        "CreatedAt" TEXT NOT NULL,
        "UpdatedAt" TEXT NOT NULL,
        "IsDeleted" INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS "RecipeIngredients" (
        "RecipeId" TEXT NOT NULL,
        "ProductId" TEXT NOT NULL,
        "ProductName" TEXT NOT NULL,
        "Quantity" REAL NOT NULL,
        "IngredientPrice" REAL NOT NULL,
        PRIMARY KEY ("RecipeId", "ProductId"),
        FOREIGN KEY ("RecipeId") REFERENCES "Recipes"("Id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "RecipePackings" (
        "RecipeId" TEXT NOT NULL,
        "PackingId" TEXT NOT NULL,
        "PackingName" TEXT NOT NULL,
        "Quantity" REAL NOT NULL,
        "UnitPrice" REAL NOT NULL,
        PRIMARY KEY ("RecipeId", "PackingId"),
        FOREIGN KEY ("RecipeId") REFERENCES "Recipes"("Id") ON DELETE CASCADE
      );
    `,
  },
  {
    id: '20260106223207_AddGroupsFeature',
    sql: `
      CREATE TABLE IF NOT EXISTS "Groups" (
        "Id" TEXT NOT NULL PRIMARY KEY,
        "Name" TEXT NOT NULL,
        "Description" TEXT NULL,
        "CreatedAt" TEXT NOT NULL,
        "UpdatedAt" TEXT NOT NULL,
        "IsDeleted" INTEGER NOT NULL DEFAULT 0
      );

      ALTER TABLE "Recipes" ADD COLUMN "GroupId" TEXT NULL;

      CREATE INDEX IF NOT EXISTS "IX_Recipes_GroupId" ON "Recipes" ("GroupId");
    `,
  },
  {
    id: '20260325093000_AddRecipeDisplayUnits',
    sql: `
      ALTER TABLE "RecipeIngredients" ADD COLUMN "DisplayQuantity" REAL NULL;
      ALTER TABLE "RecipeIngredients" ADD COLUMN "UnitOfMeasure" INTEGER NULL;

      ALTER TABLE "RecipePackings" ADD COLUMN "DisplayQuantity" REAL NULL;
      ALTER TABLE "RecipePackings" ADD COLUMN "UnitOfMeasure" INTEGER NULL;
    `,
  },
];
