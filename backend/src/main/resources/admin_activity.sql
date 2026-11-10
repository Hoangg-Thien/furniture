CREATE TABLE IF NOT EXISTS public.admin_activity_notifications (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT NOT NULL,
    actor_username VARCHAR(100) NOT NULL,
    module VARCHAR(40) NOT NULL,
    record_id BIGINT,
    title VARCHAR(250) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.admin_activity_notifications ENABLE ROW LEVEL SECURITY;
