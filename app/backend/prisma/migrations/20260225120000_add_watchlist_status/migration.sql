-- Add status field to watchlist items
ALTER TABLE "WatchlistItem"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'planned';
