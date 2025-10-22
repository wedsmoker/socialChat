-- Backfill hashtags for existing bot posts
-- This migration extracts hashtags from bot post content and populates the tags and post_tags tables
-- Idempotent: Only processes posts that don't already have tags linked

DO $$
DECLARE
    post_record RECORD;
    hashtag_record RECORD;
    tag_id INTEGER;
BEGIN
    -- Loop through bot posts that have hashtags in content but no tags linked yet
    FOR post_record IN
        SELECT p.id, p.content
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        WHERE u.is_bot = TRUE
          AND p.content ~ '#\w+'  -- Post contains hashtags
          AND pt.post_id IS NULL  -- But has no tags linked yet
    LOOP
        -- Extract all hashtags from this post
        FOR hashtag_record IN
            SELECT DISTINCT lower(substring(match[1] from 1)) as tag_name
            FROM regexp_matches(post_record.content, '#(\w+)', 'g') as match
        LOOP
            -- Insert or update tag
            INSERT INTO tags (name, use_count)
            VALUES (hashtag_record.tag_name, 1)
            ON CONFLICT (name) DO UPDATE SET use_count = tags.use_count + 1
            RETURNING id INTO tag_id;

            -- Link tag to post
            INSERT INTO post_tags (post_id, tag_id)
            VALUES (post_record.id, tag_id)
            ON CONFLICT (post_id, tag_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
