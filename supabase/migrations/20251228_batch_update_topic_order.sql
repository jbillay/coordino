-- Migration: Batch Update Topic Order
-- Purpose: Add PostgreSQL function for efficient batch updates of topic display_order
-- Related to: T084 - Performance optimization for topic reordering (FR-032)

-- Create a function to batch update topic display orders
CREATE OR REPLACE FUNCTION batch_update_topic_order(
  topic_updates jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  topic_update jsonb;
BEGIN
  -- Iterate through the array of updates
  FOR topic_update IN SELECT * FROM jsonb_array_elements(topic_updates)
  LOOP
    -- Update each topic's display_order
    UPDATE topics
    SET
      display_order = (topic_update->>'display_order')::integer,
      updated_at = now()
    WHERE
      id = (topic_update->>'id')::uuid
      AND user_id = auth.uid(); -- Security: only update user's own topics
  END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION batch_update_topic_order(jsonb) TO authenticated;

-- Add comment
COMMENT ON FUNCTION batch_update_topic_order IS 'Batch update display order for multiple topics in a single transaction';
