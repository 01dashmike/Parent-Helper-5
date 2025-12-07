-- Provider Analytics Views
-- Run this script to create views for provider metrics

-- View: v_provider_metrics
-- Aggregates bookings, revenue, and ratings by provider
CREATE OR REPLACE VIEW v_provider_metrics AS
SELECT 
    p.id AS provider_id,
    p.name AS provider_name,
    p.slug AS provider_slug,
    COUNT(DISTINCT b.id) AS total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) AS confirmed_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) AS cancelled_bookings,
    COALESCE(SUM(CASE WHEN b.status = 'confirmed' AND b.payment_status = 'paid' THEN b.total_paid ELSE 0 END), 0) AS total_revenue,
    COALESCE(SUM(CASE WHEN b.status = 'confirmed' AND b.payment_status = 'paid' AND b.created_at >= NOW() - INTERVAL '7 days' THEN b.total_paid ELSE 0 END), 0) AS revenue_last_7_days,
    COALESCE(SUM(CASE WHEN b.status = 'confirmed' AND b.payment_status = 'paid' AND b.created_at >= NOW() - INTERVAL '30 days' THEN b.total_paid ELSE 0 END), 0) AS revenue_last_30_days,
    COALESCE(AVG(CASE WHEN pr.status = 'approved' THEN pr.rating::numeric END), 0) AS average_rating,
    COUNT(DISTINCT CASE WHEN pr.status = 'approved' THEN pr.id END) AS review_count,
    COUNT(DISTINCT c.id) AS total_classes,
    COUNT(DISTINCT CASE WHEN c.is_active = true THEN c.id END) AS active_classes,
    MAX(b.created_at) AS last_booking_date,
    MAX(pr.created_at) AS last_review_date
FROM providers p
LEFT JOIN bookings b ON b.provider_id = p.id
LEFT JOIN provider_reviews pr ON pr.provider_id = p.id
LEFT JOIN classes c ON c.provider_id = p.id
GROUP BY p.id, p.name, p.slug;

-- View: v_class_metrics
-- Conversion rates and metrics per class
CREATE OR REPLACE VIEW v_class_metrics AS
SELECT 
    c.id AS class_id,
    c.name AS class_name,
    c.provider_id,
    COUNT(DISTINCT pm.id) AS total_views,
    COUNT(DISTINCT b.id) AS total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) AS confirmed_bookings,
    CASE 
        WHEN COUNT(DISTINCT pm.id) > 0 
        THEN ROUND((COUNT(DISTINCT b.id)::numeric / COUNT(DISTINCT pm.id)::numeric) * 100, 2)
        ELSE 0 
    END AS conversion_rate,
    COALESCE(SUM(CASE WHEN b.status = 'confirmed' AND b.payment_status = 'paid' THEN b.total_paid ELSE 0 END), 0) AS total_revenue,
    COALESCE(AVG(CASE WHEN pr.status = 'approved' THEN pr.rating::numeric END), 0) AS average_rating,
    COUNT(DISTINCT CASE WHEN pr.status = 'approved' THEN pr.id END) AS review_count,
    MAX(b.created_at) AS last_booking_date
FROM classes c
LEFT JOIN provider_metrics pm ON pm.provider_id = c.provider_id
LEFT JOIN bookings b ON b.class_id = c.id
LEFT JOIN provider_reviews pr ON pr.provider_id = c.provider_id
GROUP BY c.id, c.name, c.provider_id;

-- Grant permissions (adjust as needed for your RLS policies)
-- GRANT SELECT ON v_provider_metrics TO authenticated;
-- GRANT SELECT ON v_class_metrics TO authenticated;

