-- FTS5 virtual table for full-text search on notes
-- Using external content table pattern to avoid data duplication
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  title,
  content,
  content='notes',
  content_rowid='rowid'
);

-- Populate FTS index from existing notes (for initial migration)
INSERT INTO notes_fts(notes_fts) VALUES('rebuild');

-- Trigger: Keep FTS in sync on INSERT
CREATE TRIGGER IF NOT EXISTS notes_fts_insert AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, title, content)
  VALUES (NEW.rowid, NEW.title, NEW.content);
END;

-- Trigger: Keep FTS in sync on UPDATE
CREATE TRIGGER IF NOT EXISTS notes_fts_update AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.content);
  INSERT INTO notes_fts(rowid, title, content)
  VALUES (NEW.rowid, NEW.title, NEW.content);
END;

-- Trigger: Keep FTS in sync on DELETE
CREATE TRIGGER IF NOT EXISTS notes_fts_delete AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.content);
END;
