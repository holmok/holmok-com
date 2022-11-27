ALTER TABLE photo_categories 
  ADD COLUMN photo_id INT 
  REFERENCES "photos" ON DELETE SET NULL;