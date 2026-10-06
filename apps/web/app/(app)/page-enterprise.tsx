// == KALKI ENTERPRISE HOMEPAGE ==
// Industry-grade layout with consistent design system
// -----------------------------------------------------------------------------

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, Zap, Shield, Globe, Brain, Building2, Users, TrendingUp, Award, Clock, CheckCircle2, Sparkles } from 'lucide-react'
import { fetchServices } from '@/lib/services'
import { 
  PageShell, 
  Section, 
  Container, 
  Grid, 
  Card, 
  Stack,
  PageHeader,
  EmptyState 
} from '@/components/layout/PageShell'
import { EnterpriseButton, Badge } from '@/lib/design-system/components'
import { FAQStructuredData, FAQ_PRESETS } from '@/components/seo/FAQStructuredData'

export default async function Homepage() {
  const services = await fetchServices()
  const featured = services.slice(0, 6)

  return (
    <PageShell padded={false}>
      {/* Hero Section - Enterprise Grade */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-black via-slate-950 to-black overflow-hidden">
        {/* Subtle animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <Container size="xl" className="relative z-10 px-4 sm:px-6 lg:px-8 py-24">
          <Stack spacing="xl" align="center">
            {/* Brand badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-white/70 font-medium">Enterprise AI Platform</span>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center tracking-tight">
              <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                Transform Your Business
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                with AI-Powered Solutions
              </span>
            </h1>

            {/* Value proposition */}
            <p className="text-lg sm:text-xl text-white/60 text-center max-w-3xl">
              India's leading enterprise platform for web development, AI automation, lead generation, and digital transformation. Serving 500+ businesses across India.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <EnterpriseButton
                variant="primary"
                size="lg"
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
                asChild
              >
                <Link href="/marketplace">Explore Services</Link>
              </EnterpriseButton>
              
              <EnterpriseButton
                variant="outline"
                size="lg"
                asChild
              >
                <Link href="/chat">Chat with Siddhi AI</Link>
              </EnterpriseButton>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pt-8 border-t border-white/10 w-full max-w-4xl">
              <TrustIndicator
                icon={<Users className="w-5 h-5" />}
                value="500+"
                label="Clients Served"
              />
              <TrustIndicator
                icon={<Clock className="w-5 h-5" />}
                value="30-60 Days"
                label="Avg. Delivery"
              />
              <TrustIndicator
                icon={<Award className="w-5 h-5" />}
                value="4.8/5"
                label="Client Rating"
              />
              <TrustIndicator
                icon={<Globe className="w-5 h-5" />}
                value="🇮🇳 Indore"
                label="Made in India"
              />
            </div>
          </Stack>
        </Container>
      </section>

      {/* Features Grid */}
      <Section variant="alt" spacing="xl">
        <Container size="xl">
          <PageHeader
            title="Why Choose KALKI OS?"
            description="Enterprise-grade solutions built for Indian businesses"
          />

          <Grid columns={3} gap="lg">
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="AI-Powered Automation"
              description="Siddhi AI concierge handles customer queries, SETU generates verified leads, and intelligent workflows automate your operations."
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Lightning Fast Delivery"
              description="Average project completion in 30-60 days. Agile methodology ensures rapid deployment without compromising quality."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Enterprise Security"
              description="Bank-grade encryption, Row Level Security policies, and regular security audits protect your data 24/7."
            />
            <FeatureCard
              icon={<Building2 className="w-8 h-8" />}
              title="Scalable Infrastructure"
              description="From startups to enterprises, our platform scales with your business. Pay only for what you use."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Proven ROI"
              description="Average 3x ROI within 6 months. Data-driven optimization ensures continuous improvement."
            />
            <FeatureCard
              icon={<CheckCircle2 className="w-8 h-8" />}
              title="End-to-End Support"
              description="Dedicated project managers, 24/7 technical support, and comprehensive documentation."
            />
          </Grid>
        </Container>
      </Section>

      {/* Featured Services */}
      <Section spacing="xl">
        <Container size="xl">
          <PageHeader
            title="Featured Services"
            description="Discover our most popular AI-powered solutions"
          >
            <EnterpriseButton variant="outline" size="sm" asChild>
              <Link href="/marketplace">View All Services</Link>
            </EnterpriseButton>
          </PageHeader>

          {featured.length > 0 ? (
            <Grid columns={3} gap="lg">
              {featured.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </Grid>
          ) : (
            <EmptyState
              title="No services available"
              description="Check back soon for new offerings"
            />
          )}
        </Container>
      </Section>

      {/* Social Proof */}
      <Section variant="accent" spacing="xl">
        <Container size="lg">
          <Stack spacing="lg" align="center">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white">
              Trusted by Industry Leaders
            </h2>
            <p className="text-white/60 text-center max-w-2xl">
              From startups to Fortune 500 companies, businesses across India rely on KALKI OS for their digital transformation.
            </p>
            
            {/* Client logos would go here */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-6 opacity-50 grayscale hover:grayscale-0 transition-all">
              {/* Placeholder for client logos */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                  <span className="text-white/30 text-sm">Client {i + 1}</span>
                </div>
              ))}
            </div>
          </Stack>
        </Container>
      </Section>

      {/* FAQ Section - AEO Optimized */}
      <Section spacing="xl">
        <Container size="lg">
          <FAQStructuredData 
            questions={FAQ_PRESETS.aiServices}
            className="max-w-4xl mx-auto"
          />
        </Container>
      </Section>

      {/* Final CTA */}
      <Section variant="accent" spacing="xl">
        <Container size="lg">
          <Card variant="elevated" padding="lg" className="text-center bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border-cyan-500/20">
            <Stack spacing="lg" align="center">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Ready to Transform Your Business?
              </h2>
              <p className="text-white/70 max-w-2xl">
                Join 500+ businesses already using KALKI OS. Get started today with a free consultation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <EnterpriseButton variant="primary" size="lg" asChild>
                  <Link href="/contact">Schedule Free Consultation</Link>
                </EnterpriseButton>
                <EnterpriseButton variant="outline" size="lg" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </EnterpriseButton>
              </div>
            </Stack>
          </Card>
        </Container>
      </Section>
    </PageShell>
  )
}

/**
 * Trust Indicator Component
 */
function TrustIndicator({ 
  icon, 
  value, 
  label 
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div className="text-cyan-400">{icon}</div>
      <div className="text-xl md:text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/50">{label}</div>
    </div>
  )
}

/**
 * Feature Card Component
 */
function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <Card variant="default" padding="lg" hoverable>
      <Stack spacing="base">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-cyan-400">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-white/60 text-sm leading-relaxed">{description}</p>
      </Stack>
    </Card>
  )
}

/**
 * Service Card Component (placeholder - use your actual ServiceCard)
 */
function ServiceCard({ service }: { service: any }) {
  return (
    <Card variant="default" padding="base" hoverable>
      <Stack spacing="base">
        <div className="aspect-video bg-white/5 rounded-lg overflow-hidden">
          {/* Image placeholder */}
        </div>
        <div>
          <Badge variant="info" size="sm" className="mb-2">
            {service.category}
          </Badge>
          <h3 className="text-lg font-semibold text-white mb-2">{service.name}</h3>
          <p className="text-white/60 text-sm line-clamp-2">{service.description}</p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-cyan-400 font-semibold">₹{service.price}</span>
          <EnterpriseButton variant="ghost" size="sm" asChild>
            <Link href={`/marketplace/${service.category}/${service.slug}`}>Learn More</Link>
          </EnterpriseButton>
        </div>
      </Stack>
    </Card>
  )
}
