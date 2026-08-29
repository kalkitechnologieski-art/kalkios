-- Drop existing table
DROP TABLE IF EXISTS services CASCADE;

-- Create fresh services table with enterprise columns
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  description TEXT,
  long_description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  target_industries TEXT[] DEFAULT '{}',
  icon TEXT,
  image_url TEXT,
  video_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Public read for active services
CREATE POLICY "Anyone can read active services" ON services
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('ceo', 'admin')
    )
  );

-- ---------- SEED DATA ----------
INSERT INTO services (
  name, slug, category, sub_category,
  description, long_description, price,
  features, target_industries, icon,
  rating, review_count, is_active
) VALUES

-- 1. Web Development (5k to 2.5L)
(
  'Landing Page (5 Pages)',
  'landing-page-5-pages',
  'Web Development',
  'Starter Websites',
  'Professional 5-page landing page to establish your digital presence.',
  'Get a stunning, fully responsive 5-page website (Home, About, Services, Contact, Blog). Perfect for small businesses, freelancers, and startups looking to go online quickly with modern design and fast load times.',
  5000,
  '["5 Custom Designed Pages", "Mobile Responsive", "Contact Form Integration", "Basic SEO Setup", "1 Month Free Hosting", "Social Media Links"]'::jsonb,
  ARRAY['All Industries'],
  '🌐',
  4.8, 45, true
),
(
  'AI E-Commerce Platform (Multi-Vendor)',
  'ai-multivendor-ecommerce',
  'Web Development',
  'AI E-Commerce',
  'Fully AI-integrated multi-vendor marketplace platform.',
  'A complete white-label e-commerce solution with AI-powered product recommendations, vendor dashboards, multi-currency support, and automated inventory sync. Ideal for astrologers selling consultations, real estate agents listing properties, or general retail.',
  250000,
  '["AI Product Recommendations", "Multi-Vendor Support", "Vendor Dashboards", "Payment Gateway Integration", "Real-time Analytics", "Astrology/Real Estate Templates", "Mobile App Ready"]'::jsonb,
  ARRAY['Astrology', 'Real Estate', 'Retail', 'E-commerce'],
  '🏪',
  5.0, 12, true
),

-- 2. App Development (12k to 12L)
(
  'Simple Business App',
  'simple-business-app',
  'App Development',
  'Basic Apps',
  'Cross-platform mobile app for your business or service.',
  'A cross-platform (iOS/Android) app built with React Native. Includes user authentication, push notifications, and a CMS backend. Perfect for astrologers who want to send daily horoscopes or real estate agents to show listings.',
  12000,
  '["Cross-Platform (iOS/Android)", "Push Notifications", "User Authentication", "CMS Backend", "Basic Analytics", "App Store Deployment"]'::jsonb,
  ARRAY['Astrology', 'Real Estate', 'Fitness', 'Education'],
  '📱',
  4.5, 30, true
),
(
  'Fully Managed AI App',
  'fully-managed-ai-app',
  'App Development',
  'Enterprise Apps',
  'Full lifecycle management with integrated AI and dedicated support.',
  'A turn-key, fully managed application with AI chatbots, predictive analytics, automated workflows, and a dedicated development team handling updates, hosting, and scaling 24/7.',
  1200000,
  '["AI Chatbot Integration", "Predictive Analytics", "Dedicated Team", "24/7 Support", "Scalable Architecture", "Custom AI Model Training", "Horoscope/Kundali API Integration"]'::jsonb,
  ARRAY['Astrology', 'FinTech', 'Healthcare', 'Real Estate'],
  '🤖',
  4.9, 8, true
),

-- 3. Social Media Marketing (20k/month)
(
  'SMO & Viral Marketing',
  'smo-viral-marketing',
  'Marketing',
  'Social Media',
  'Guaranteed viral growth across Instagram, Facebook, and YouTube.',
  'We use advanced AI trend analysis and influencer mapping to create content that goes viral. Includes daily engagement, story marketing, and viral video strategies to 10x your brand visibility within 90 days.',
  20000,
  '["AI Trend Analysis", "Daily Engagement", "Story Marketing", "Influencer Outreach", "Viral Video Strategy", "Monthly ROI Reports"]'::jsonb,
  ARRAY['All Industries'],
  '📈',
  4.7, 220, true
),

-- 4. Graphic Designing (499 to 299)
(
  'Premium Logo Design',
  'premium-logo-design',
  'Design',
  'Branding',
  'Professional logo design with 3 unique concepts and unlimited revisions.',
  'Stand out with a high-end logo designed by our expert team. Includes 3 initial concepts, 5 color palettes, and unlimited revisions until you are 100% satisfied. Delivered in all popular formats (PNG, SVG, PDF).',
  499,
  '["3 Unique Concepts", "Unlimited Revisions", "5 Color Palettes", "All Formats (PNG/SVG/PDF)", "Commercial Rights", "48-Hour Delivery"]'::jsonb,
  ARRAY['All Industries'],
  '🎨',
  4.9, 580, true
),
(
  'Single Graphic Design',
  'single-graphic-design',
  'Design',
  'Visual Content',
  'High-quality social media posts, banners, or thumbnails.',
  'Get a single stunning graphic design for your social media, ads, or website. Choose from social media posts, YouTube thumbnails, Instagram stories, or ad banners.',
  299,
  '["Custom Design", "Social Media Optimized", "Editable Source Files", "2 Revisions", "24-Hour Delivery"]'::jsonb,
  ARRAY['All Industries'],
  '🖼️',
  4.6, 340, true
),

-- 5. Video Editing (999 to 9999)
(
  'Basic Video Editing',
  'basic-video-editing',
  'Media',
  'Video Production',
  'Professional trimming, transitions, and color grading for short videos.',
  'Get your raw footage polished with professional color grading, smooth transitions, and background audio mixing. Perfect for social media reels, YouTube shorts, and promotional clips.',
  999,
  '["Color Grading", "Transitions", "Audio Mixing", "Subtitles/Closed Captions", "Export in 1080p", "24-Hour Turnaround"]'::jsonb,
  ARRAY['All Industries'],
  '🎬',
  4.8, 115, true
),
(
  'Cinematic & Motion Graphics',
  'cinematic-motion-graphics',
  'Media',
  'Video Production',
  'Full-scale video production with motion graphics, 3D elements, and custom animations.',
  'High-end video production including 3D motion graphics, kinetic typography, and custom animation sequences. Ideal for product launches, brand commercials, and explainer videos.',
  9999,
  '["4K Resolution", "3D Motion Graphics", "Kinetic Typography", "Professional Voiceover", "Custom Soundtrack", "Multiple Revisions"]'::jsonb,
  ARRAY['Real Estate', 'Technology', 'Fashion', 'Astrology'],
  '🎥',
  5.0, 22, true
),

-- 6. AI Automations (5999 to 29999)
(
  'AI Chatbot Automation',
  'ai-chatbot-automation',
  'AI Automation',
  'Lead Generation',
  'Automate lead qualification and appointment booking via AI chat.',
  'Deploy an AI agent on your website to automatically qualify leads, answer FAQs, and book appointments 24/7. Trained on your specific industry data.',
  5999,
  '["24/7 Availability", "Lead Qualification", "Appointment Booking", "CRM Integration", "Multi-language Support", "Email Follow-ups"]'::jsonb,
  ARRAY['Astrology', 'Real Estate', 'Healthcare', 'Education'],
  '💬',
  4.5, 67, true
),
(
  'AI Horoscope & Kundali API',
  'ai-horoscope-kundali-api',
  'AI Automation',
  'Astrology Tech',
  'Integrate AI-powered horoscope and kundali generation into your app or website.',
  'Ready-to-use APIs for daily horoscopes, compatibility checks, and detailed kundali (birth chart) generation powered by advanced AI algorithms. Perfect for astrology platforms and mobile apps.',
  29999,
  '["Daily Horoscope API", "Kundali Generation", "Compatibility Matching", "Muhurta (Auspicious Time) API", "Scalable Infrastructure", "White-label Ready"]'::jsonb,
  ARRAY['Astrology'],
  '🔮',
  4.9, 15, true
),

-- 7. AI Support Bot (7999/month)
(
  'Custom AI Support Bot',
  'custom-ai-support-bot',
  'AI Chatbots',
  'Customer Support',
  'A fully trained AI support bot integrated into your website 24/7.',
  'We build, train, and host a custom AI support bot on your domain. It learns from your website content, knowledge base, and FAQs to handle 80%+ of customer queries automatically, reducing support costs drastically. Includes monthly retraining.',
  7999,
  '["Domain-Specific Training", "24/7 Availability", "Human Handoff", "Analytics Dashboard", "Monthly Retraining", "Multi-channel (Web/WhatsApp)"]'::jsonb,
  ARRAY['E-commerce', 'SaaS', 'Healthcare', 'Real Estate'],
  '🤖',
  4.8, 34, true
),

-- 8. Custom Dashboards (19999 to 5.8L)
(
  'Standard Admin Dashboard',
  'standard-admin-dashboard',
  'Development',
  'Dashboards',
  'A beautiful custom dashboard for managing your business operations.',
  'Get a tailor-made admin dashboard with user management, content editing, analytics charts, and data tables. Built with Next.js and Supabase for enterprise-grade security.',
  19999,
  '["User Management", "Content Editing (CMS)", "Analytics Charts", "Data Tables", "Role-Based Access", "Responsive Design"]'::jsonb,
  ARRAY['All Industries'],
  '📊',
  4.6, 89, true
),
(
  'AI-Powered Enterprise Suite',
  'ai-enterprise-dashboard-suite',
  'Development',
  'Dashboards',
  'A fully managed, AI-powered analytics suite with predictive insights.',
  'A comprehensive enterprise dashboard featuring predictive analytics, anomaly detection, resource planning, and full integration with your existing business apps. Includes dedicated dashboard engineers for custom modifications.',
  580000,
  '["Predictive Analytics", "Anomaly Detection", "Resource Planning", "Custom Integrations", "Dedicated Engineers", "Real-time Data Sync", "White-label Branding"]'::jsonb,
  ARRAY['FinTech', 'Real Estate', 'Manufacturing', 'Astrology'],
  '🏢',
  5.0, 5, true
);
