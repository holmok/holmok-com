DROP INDEX "images_stub_idx";

DROP TABLE "images" CASCADE;

DROP INDEX "images_category_lookup_images_idx";
DROP INDEX "images_category_lookup_categories_idx";
DROP INDEX "images_category_lookup_images_categories_idx";

DROP TABLE "images_category_lookup";