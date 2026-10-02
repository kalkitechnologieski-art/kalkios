// == KALKI B3 COMMAND ==
// Admin settings with Commerce tab: tax, referral defaults, code defaults.
// -----------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { Settings, Percent, Gift, Tag, Save } from 'lucide-react';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { toast } from 'sonner';
import { logAdminAction } from '@/lib/admin/actions';

type Tab = 'commerce' | 'referral' | 'codes';

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>('commerce');

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-white font-mono flex items-center gap-2">
        <Settings className="w-6 h-6 text-cyan-400" />
        Settings
      </h1>

      <div className="flex gap-2 border-b border-cyan-500/10 pb-1">
        {(['commerce', 'referral', 'codes'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-mono transition ${
              tab === t ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'commerce' && (
        <CommerceSettings />
      )}
      {tab === 'referral' && (
        <ReferralSettings />
      )}
      {tab === 'codes' && (
        <CodeSettings />
      )}
    </div>
  );
}

function CommerceSettings() {
  const [gst, setGst] = useState(18);
  const [currency, setCurrency] = useState('INR');

  const save = async () => {
    await logAdminAction({
      action: 'settings_commerce_update',
      payload: { gst, currency },
    });
    toast.success('Commerce settings saved');
  };

  return (
    <div className="space-y-4">
      <Section icon={Percent} title="Tax">
        <Field label="Default GST (%)">
          <input
            type="number"
            value={gst}
            onChange={(e) => setGst(Number(e.target.value))}
            className={inputCls}
          />
        </Field>
      </Section>

      <Section icon={Tag} title="Currency">
        <Field label="Primary currency">
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </Field>
      </Section>

      <div className="flex justify-end">
        <LuxuryButton variant="cyber" size="default" label="Save" icon={<Save className="w-4 h-4" />} onClick={save} />
      </div>
    </div>
  );
}

function ReferralSettings() {
  const [reward, setReward] = useState(500);
  const [discount, setDiscount] = useState(20);
  const [minPurchase, setMinPurchase] = useState(1000);

  const save = async () => {
    await logAdminAction({
      action: 'settings_referral_update',
      payload: { reward, discount, minPurchase },
    });
    toast.success('Referral settings saved');
  };

  return (
    <div className="space-y-4">
      <Section icon={Gift} title="Rewards">
        <Field label="Referrer reward (₹)">
          <input type="number" value={reward} onChange={(e) => setReward(Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Referee discount (%)">
          <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Minimum purchase to qualify (₹)">
          <input type="number" value={minPurchase} onChange={(e) => setMinPurchase(Number(e.target.value))} className={inputCls} />
        </Field>
      </Section>
      <div className="flex justify-end">
        <LuxuryButton variant="cyber" size="default" label="Save" icon={<Save className="w-4 h-4" />} onClick={save} />
      </div>
    </div>
  );
}

function CodeSettings() {
  const [stackable, setStackable] = useState(false);
  const [maxUsesPerUser, setMaxUsesPerUser] = useState(1);

  const save = async () => {
    await logAdminAction({
      action: 'settings_code_update',
      payload: { stackable, maxUsesPerUser },
    });
    toast.success('Code settings saved');
  };

  return (
    <div className="space-y-4">
      <Section icon={Tag} title="Defaults">
        <Toggle label="Allow stacking multiple codes" value={stackable} onChange={setStackable} />
        <Field label="Max uses per user">
          <input type="number" value={maxUsesPerUser} onChange={(e) => setMaxUsesPerUser(Number(e.target.value))} className={inputCls} />
        </Field>
      </Section>
      <div className="flex justify-end">
        <LuxuryButton variant="cyber" size="default" label="Save" icon={<Save className="w-4 h-4" />} onClick={save} />
      </div>
    </div>
  );
}

const inputCls = 'w-full bg-black/40 border border-cyan-500/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50 font-mono';

function Section({ icon: Icon, title, children }: { icon: typeof Percent; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 space-y-3">
      <h3 className="text-white font-mono text-sm flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan-400" />
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-wider block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/70 text-xs font-mono">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${value ? 'bg-cyan-600' : 'bg-white/20'}`}
        aria-label={label}
      >
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
