import { useState, useRef } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Check,
  X,
  Globe,
  Share2,
  Smartphone,
  AlertCircle,
  Save,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Toast } from '@/components/shared/Toast';
import type {
  BrandProfile,
  OfficialSocialAsset,
  OfficialAppAsset,
  SocialPlatform,
  AppStore,
} from '@/types';

const SOCIAL_PLATFORMS: SocialPlatform[] = ['Instagram', 'Facebook', 'LinkedIn', 'X', 'YouTube', 'TikTok', 'Telegram', 'Bluesky', 'Other'];
const APP_STORES: AppStore[] = ['Google Play', 'Apple App Store', 'Amazon Appstore', 'Other'];

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function BrandProfilePage() {
  const { brandProfile, saveBrandProfile } = useApp();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<BrandProfile>(brandProfile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completion = calculateCompletion(profile);

  function calculateCompletion(p: BrandProfile): number {
    const checks = [
      !!p.companyName,
      !!p.websiteUrl && isValidUrl(p.websiteUrl),
      !!p.description,
      !!p.logoDataUrl,
      p.officialSocials.length > 0,
      p.officialApps.length > 0,
      p.officialDomains.length > 0,
      p.knownPublishers.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  function showToast(type: 'success' | 'error' | 'warning', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!profile.companyName.trim()) e.companyName = 'Company name is required';
    if (!profile.websiteUrl.trim()) e.websiteUrl = 'Website URL is required';
    else if (!isValidUrl(profile.websiteUrl)) e.websiteUrl = 'Invalid URL format';
    if (!profile.description.trim()) e.description = 'Brand description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) {
      showToast('error', 'Please fix the validation errors before saving');
      return;
    }
    // Remove duplicate domains and publishers
    const cleaned: BrandProfile = {
      ...profile,
      officialDomains: [...new Set(profile.officialDomains.map((d) => d.trim()).filter(Boolean))],
      knownPublishers: [...new Set(profile.knownPublishers.map((p) => p.trim()).filter(Boolean))],
    };
    try {
      await saveBrandProfile(cleaned);
      setProfile(cleaned);
      setEditing(false);
      showToast('success', 'Brand profile saved and connected to backend scans');
    } catch {
      setProfile(cleaned);
      setEditing(false);
      showToast('warning', 'Saved in this browser, but backend sync failed. Scans may use the previous profile.');
    }
  }

  function handleCancel() {
    setProfile(brandProfile);
    setErrors({});
    setEditing(false);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Logo file must be under 2MB');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      showToast('error', 'Logo must be PNG, JPEG, SVG, or WebP');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((p) => ({ ...p, logoDataUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  // Social asset management
  const [newSocial, setNewSocial] = useState<Partial<OfficialSocialAsset>>({ platform: 'Instagram', verified: false });

  function addSocial() {
    if (!newSocial.displayName || !newSocial.username || !newSocial.url) {
      showToast('error', 'All social fields are required');
      return;
    }
    if (!isValidUrl(newSocial.url)) {
      showToast('error', 'Invalid social URL');
      return;
    }
    // Prevent duplicates
    const isDuplicate = profile.officialSocials.some(
      (s) => s.username.toLowerCase() === newSocial.username!.toLowerCase() && s.platform === newSocial.platform
    );
    if (isDuplicate) {
      showToast('error', 'This social asset already exists');
      return;
    }
    setProfile((p) => ({
      ...p,
      officialSocials: [
        ...p.officialSocials,
        {
          id: `off-soc-${Date.now()}`,
          platform: newSocial.platform as SocialPlatform,
          displayName: newSocial.displayName!,
          username: newSocial.username!,
          url: newSocial.url!,
          verified: newSocial.verified || false,
        },
      ],
    }));
    setNewSocial({ platform: 'Instagram', verified: false });
  }

  function removeSocial(id: string) {
    setProfile((p) => ({ ...p, officialSocials: p.officialSocials.filter((s) => s.id !== id) }));
  }

  // App asset management
  const [newApp, setNewApp] = useState<Partial<OfficialAppAsset>>({ store: 'Google Play' });

  function addApp() {
    if (!newApp.appName || !newApp.publisher || !newApp.url) {
      showToast('error', 'App name, publisher, and URL are required');
      return;
    }
    if (!isValidUrl(newApp.url)) {
      showToast('error', 'Invalid app URL');
      return;
    }
    const isDuplicate = profile.officialApps.some(
      (a) => a.appName.toLowerCase() === newApp.appName!.toLowerCase() &&
             a.publisher.toLowerCase() === newApp.publisher!.toLowerCase()
    );
    if (isDuplicate) {
      showToast('error', 'This app asset already exists');
      return;
    }
    setProfile((p) => ({
      ...p,
      officialApps: [
        ...p.officialApps,
        {
          id: `off-app-${Date.now()}`,
          appName: newApp.appName!,
          store: newApp.store as AppStore,
          publisher: newApp.publisher!,
          url: newApp.url!,
          packageId: newApp.packageId,
        },
      ],
    }));
    setNewApp({ store: 'Google Play' });
  }

  function removeApp(id: string) {
    setProfile((p) => ({ ...p, officialApps: p.officialApps.filter((a) => a.id !== id) }));
  }

  // Domain and publisher management
  const [newDomain, setNewDomain] = useState('');
  const [newPublisher, setNewPublisher] = useState('');

  function addDomain() {
    if (!newDomain.trim()) return;
    if (profile.officialDomains.includes(newDomain.trim())) {
      showToast('error', 'Domain already exists');
      return;
    }
    setProfile((p) => ({ ...p, officialDomains: [...p.officialDomains, newDomain.trim()] }));
    setNewDomain('');
  }

  function removeDomain(d: string) {
    setProfile((p) => ({ ...p, officialDomains: p.officialDomains.filter((x) => x !== d) }));
  }

  function addPublisher() {
    if (!newPublisher.trim()) return;
    if (profile.knownPublishers.includes(newPublisher.trim())) {
      showToast('error', 'Publisher already exists');
      return;
    }
    setProfile((p) => ({ ...p, knownPublishers: [...p.knownPublishers, newPublisher.trim()] }));
    setNewPublisher('');
  }

  function removePublisher(pub: string) {
    setProfile((p) => ({ ...p, knownPublishers: p.knownPublishers.filter((x) => x !== pub) }));
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Brand Profile</h1>
          <p className="text-slate-400 text-sm">Configure your legitimate brand assets for reference</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${completion === 100 ? 'bg-emerald-500' : completion >= 50 ? 'bg-sky-500' : 'bg-amber-500'}`}
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{completion}%</span>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <X size={16} /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
              >
                <Save size={16} /> Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors flex items-center gap-1.5"
            >
              <Edit2 size={16} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Basic info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={18} className="text-sky-400" />
          <h2 className="text-sm font-semibold text-white">Company Information</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden bg-slate-800/50">
              {profile.logoDataUrl ? (
                <img src={profile.logoDataUrl} alt="Brand logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 size={32} className="text-slate-600" />
              )}
            </div>
            {editing && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 w-28 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
                >
                  <Upload size={12} /> Upload Logo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Company / Brand Name *</label>
              <input
                type="text"
                value={profile.companyName}
                disabled={!editing}
                onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none disabled:opacity-60"
                placeholder="e.g. NovaPay"
              />
              {errors.companyName && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.companyName}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Official Website URL *</label>
              <input
                type="url"
                value={profile.websiteUrl}
                disabled={!editing}
                onChange={(e) => setProfile((p) => ({ ...p, websiteUrl: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none disabled:opacity-60"
                placeholder="https://www.example.com"
              />
              {errors.websiteUrl && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.websiteUrl}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Brand Description *</label>
              <textarea
                value={profile.description}
                disabled={!editing}
                onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none disabled:opacity-60 resize-none"
                placeholder="Describe your brand..."
              />
              {errors.description && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Official Domains */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Official Domains</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {profile.officialDomains.length === 0 && (
            <p className="text-xs text-slate-500">No domains added yet.</p>
          )}
          {profile.officialDomains.map((d) => (
            <div key={d} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200">
              {d}
              {editing && (
                <button onClick={() => removeDomain(d)} className="text-slate-500 hover:text-red-400">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDomain()}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none"
              placeholder="e.g. novapay.com"
            />
            <button onClick={addDomain} className="px-3 py-2 rounded-lg bg-slate-800 text-sky-400 hover:bg-slate-700 transition-colors">
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Known Publishers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-white">Known Official Publishers</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {profile.knownPublishers.length === 0 && (
            <p className="text-xs text-slate-500">No publishers added yet.</p>
          )}
          {profile.knownPublishers.map((pub) => (
            <div key={pub} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200">
              {pub}
              {editing && (
                <button onClick={() => removePublisher(pub)} className="text-slate-500 hover:text-red-400">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newPublisher}
              onChange={(e) => setNewPublisher(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPublisher()}
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none"
              placeholder="e.g. NovaPay Inc."
            />
            <button onClick={addPublisher} className="px-3 py-2 rounded-lg bg-slate-800 text-violet-400 hover:bg-slate-700 transition-colors">
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Official Social Assets */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Share2 size={18} className="text-sky-400" />
          <h2 className="text-sm font-semibold text-white">Official Social Media Assets ({profile.officialSocials.length})</h2>
        </div>
        <div className="space-y-2 mb-4">
          {profile.officialSocials.length === 0 && (
            <p className="text-xs text-slate-500">No official social accounts registered.</p>
          )}
          {profile.officialSocials.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded flex-shrink-0">{s.platform}</span>
                <span className="text-sm text-white font-medium truncate">{s.displayName}</span>
                <span className="text-xs text-slate-400 truncate">@{s.username}</span>
                {s.verified && <Check size={14} className="text-emerald-400 flex-shrink-0" />}
              </div>
              {editing && (
                <button onClick={() => removeSocial(s.id)} className="text-slate-500 hover:text-red-400 flex-shrink-0 ml-2">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <select
              value={newSocial.platform}
              onChange={(e) => setNewSocial((s) => ({ ...s, platform: e.target.value as SocialPlatform }))}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none"
            >
              {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="text" placeholder="Display name" value={newSocial.displayName || ''} onChange={(e) => setNewSocial((s) => ({ ...s, displayName: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none" />
            <input type="text" placeholder="Username" value={newSocial.username || ''} onChange={(e) => setNewSocial((s) => ({ ...s, username: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none" />
            <input type="url" placeholder="Profile URL" value={newSocial.url || ''} onChange={(e) => setNewSocial((s) => ({ ...s, url: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none" />
            <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={newSocial.verified || false} onChange={(e) => setNewSocial((s) => ({ ...s, verified: e.target.checked }))} className="accent-sky-500" />
                Verified account
              </label>
              <button onClick={addSocial} className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 transition-colors flex items-center gap-1">
                <Plus size={14} /> Add Social
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Official App Assets */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone size={18} className="text-orange-400" />
          <h2 className="text-sm font-semibold text-white">Official Mobile Applications ({profile.officialApps.length})</h2>
        </div>
        <div className="space-y-2 mb-4">
          {profile.officialApps.length === 0 && (
            <p className="text-xs text-slate-500">No official apps registered.</p>
          )}
          {profile.officialApps.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-medium text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded flex-shrink-0">{a.store}</span>
                <span className="text-sm text-white font-medium truncate">{a.appName}</span>
                <span className="text-xs text-slate-400 truncate">by {a.publisher}</span>
                {a.packageId && <span className="text-xs text-slate-500 hidden md:inline truncate">{a.packageId}</span>}
              </div>
              {editing && (
                <button onClick={() => removeApp(a.id)} className="text-slate-500 hover:text-red-400 flex-shrink-0 ml-2">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <input type="text" placeholder="App name" value={newApp.appName || ''} onChange={(e) => setNewApp((a) => ({ ...a, appName: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none" />
            <input type="text" placeholder="Publisher" value={newApp.publisher || ''} onChange={(e) => setNewApp((a) => ({ ...a, publisher: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none" />
            <select value={newApp.store} onChange={(e) => setNewApp((a) => ({ ...a, store: e.target.value as AppStore }))} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none">
              {APP_STORES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="url" placeholder="Store URL" value={newApp.url || ''} onChange={(e) => setNewApp((a) => ({ ...a, url: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none" />
            <input type="text" placeholder="Package ID (optional)" value={newApp.packageId || ''} onChange={(e) => setNewApp((a) => ({ ...a, packageId: e.target.value }))} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none" />
            <button onClick={addApp} className="px-3 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-1">
              <Plus size={16} /> Add App
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 px-2">
        Last updated: {new Date(profile.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
