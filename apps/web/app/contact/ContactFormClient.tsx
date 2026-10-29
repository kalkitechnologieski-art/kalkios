'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail, Phone, ShieldCheck } from 'lucide-react';

type Fields = {
  name: string;
  email: string;
  phone: string;
  company: string;
  serviceInterest: string;
  budgetRange: string;
  timeline: string;
  message: string;
};

const initial: Fields = {
  name: '',
  email: '',
  phone: '',
  company: '',
  serviceInterest: '',
  budgetRange: '',
  timeline: '',
  message: '',
};

const SERVICES = [
  'Website / landing page',
  'E-commerce',
  'SEO & lead generation',
  'AI automation & chatbot',
  'Data analytics',
  'Mobile app',
  'Something else',
];

const BUDGETS = ['Under ₹10,000', '₹10,000 – ₹50,000', '₹50,000 – ₹2 lakh', '₹2 lakh+', 'Not sure yet'];
const TIMELINES = ['ASAP', 'This month', 'Next quarter', 'Exploring'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const inputCls =
  'w-full rounded-xl bg-white/5 border border-white/12 px-4 py-3 text-white text-[15px] placeholder:text-white/35 outline-none transition focus:border-cyan-500/50 focus:bg-white/[0.07]';

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'rounded-full px-3.5 py-2 text-[13px] font-medium border border-cyan-500/50 bg-cyan-500/15 text-cyan-200 transition'
          : 'rounded-full px-3.5 py-2 text-[13px] font-medium border border-white/12 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white/85 transition'
      }
    >
      {label}
    </button>
  );
}

export function ContactFormClient() {
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Fields>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ refCode: string | null } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fallback, setFallback] = useState<{ email: string; phone: string } | null>(null);
  // Honeypot value: stays empty for humans, gets dropped by the API for bots.
  const [botField, setBotField] = useState('');

  const set = (key: keyof Fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const stepOneValid = useMemo(
    () => Boolean(fields.serviceInterest && fields.message.trim().length >= 10),
    [fields.serviceInterest, fields.message],
  );

  const validateStepTwo = () => {
    const next: Record<string, string> = {};
    if (fields.name.trim().length < 2) next.name = 'Please enter your full name.';
    if (!EMAIL_RE.test(fields.email.trim())) next.email = 'We need a valid email to send the quote.';
    if (fields.phone.trim() && !/^[0-9+\-\s()]{7,20}$/.test(fields.phone.trim())) {
      next.phone = 'That phone number does not look right.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setFormError(null);
    setFallback(null);
    if (!validateStepTwo()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, website: botField, source: 'contact_page' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(json?.error ?? 'Could not send your enquiry. Please try again.');
        if (json?.fallback) setFallback(json.fallback as { email: string; phone: string });
        return;
      }
      setDone({ refCode: json?.refCode ? String(json.refCode) : null });
    } catch {
      setFormError('Network problem — nothing was sent. Try once more, or email us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="kalki-panel rounded-2xl p-7 text-center"
      >
        <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
        <h3 className="text-white text-xl font-bold mt-4">Enquiry received</h3>
        {done.refCode && (
          <p className="text-cyan-300 font-mono text-sm mt-2">Reference {done.refCode}</p>
        )}
        <p className="text-white/60 text-sm mt-4 leading-relaxed">
          A person reads this next. You will get a written scope, a fixed price and a delivery date —
          within 24 hours, during IST working hours. Nothing is charged to start.
        </p>
        <ol className="text-white/55 text-sm mt-6 space-y-2 text-left max-w-sm mx-auto">
          <li className="flex gap-3"><span className="text-cyan-400 font-mono">01</span> We review the brief and ask two or three clarifying questions at most.</li>
          <li className="flex gap-3"><span className="text-cyan-400 font-mono">02</span> You get the proposal in writing — scope, price, timeline.</li>
          <li className="flex gap-3"><span className="text-cyan-400 font-mono">03</span> Work starts the day you accept. One direct line to whoever builds it.</li>
        </ol>
      </motion.div>
    );
  }

  return (
    <div className="kalki-panel rounded-2xl p-6 md:p-7">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white text-lg font-bold font-mono">
            {step === 0 ? 'What do you need built?' : 'Where do we send the quote?'}
          </h2>
          <p className="text-white/45 text-xs mt-1">Step {step + 1} of 2 · takes about 40 seconds</p>
        </div>
        <div className="flex gap-1.5" aria-hidden>
          {[0, 1].map((i) => (
            <span key={i} className={`h-1.5 w-8 rounded-full ${i <= step ? 'bg-cyan-500' : 'bg-white/12'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {step === 0 ? (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-5"
          >
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-2.5">Service</p>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map((label) => (
                  <Chip key={label} label={label} active={fields.serviceInterest === label} onClick={() => set('serviceInterest', label)} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider mb-2.5">Budget</p>
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((label) => (
                    <Chip key={label} label={label} active={fields.budgetRange === label} onClick={() => set('budgetRange', label)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider mb-2.5">When</p>
                <div className="flex flex-wrap gap-2">
                  {TIMELINES.map((label) => (
                    <Chip key={label} label={label} active={fields.timeline === label} onClick={() => set('timeline', label)} />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="enquiry-message" className="text-white/60 text-xs uppercase tracking-wider block mb-2">
                The brief
              </label>
              <textarea
                id="enquiry-message"
                rows={4}
                maxLength={4000}
                className={inputCls}
                placeholder="Current site is slow, we sell ayurvedic products, need a faster store plus Google ranking in Hindi and English…"
                value={fields.message}
                onChange={(e) => set('message', e.target.value)}
              />
              <p className="text-white/35 text-xs mt-1.5">{fields.message.trim().length < 10 ? 'At least 10 characters.' : 'Good — that is enough to quote from.'}</p>
            </div>

            <button
              type="button"
              disabled={!stepOneValid}
              onClick={() => setStep(1)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] transition"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="enquiry-name" className="text-white/60 text-xs uppercase tracking-wider block mb-2">Full name *</label>
                <input id="enquiry-name" className={inputCls} value={fields.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
                {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="enquiry-company" className="text-white/60 text-xs uppercase tracking-wider block mb-2">Company</label>
                <input id="enquiry-company" className={inputCls} value={fields.company} onChange={(e) => set('company', e.target.value)} autoComplete="organization" placeholder="Optional" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="enquiry-email" className="text-white/60 text-xs uppercase tracking-wider block mb-2">Email *</label>
                <input id="enquiry-email" type="email" className={inputCls} value={fields.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" placeholder="you@business.in" />
                {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="enquiry-phone" className="text-white/60 text-xs uppercase tracking-wider block mb-2">Phone / WhatsApp</label>
                <input id="enquiry-phone" className={inputCls} value={fields.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" placeholder="+91…" />
                {errors.phone && <p className="text-red-400 text-xs mt-1.5">{errors.phone}</p>}
              </div>
            </div>

            {/* Honeypot — visually hidden, bots fill it, people never see it */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              value={botField}
              onChange={(e) => setBotField(e.target.value)}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/12 text-white/70 text-sm hover:bg-white/5 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-semibold disabled:opacity-60 hover:scale-[1.01] transition"
              >
                {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>) : (<>Send enquiry <ArrowRight className="w-4 h-4" /></>)}
              </button>
            </div>

            <p className="text-white/40 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400/70" />
              Your details go to one founder inbox. No resale, no newsletter unless you ask.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {formError && (
        <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p className="text-red-300">{formError}</p>
          {fallback && (
            <div className="mt-3 flex flex-wrap gap-4 text-red-200">
              <a className="inline-flex items-center gap-2 hover:underline" href={`mailto:${fallback.email}`}><Mail className="w-4 h-4" />{fallback.email}</a>
              <a className="inline-flex items-center gap-2 hover:underline" href={`tel:${fallback.phone.replace(/\s/g, '')}`}><Phone className="w-4 h-4" />{fallback.phone}</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
