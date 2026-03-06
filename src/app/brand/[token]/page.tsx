'use client';

import { useState, useEffect, useRef, use } from 'react';
import { Upload, Camera, Instagram, Facebook, Play, Check, Loader2, Sparkles, Image as ImageIcon, Video, ArrowRight, ChevronLeft } from 'lucide-react';

interface BrandInfo {
  name: string;
  language: string;
  connectedPlatforms: string[];
}

interface Draft {
  id: string;
  caption: string;
  hashtags: string[];
  style: string;
  format: string;
  optionIndex: number;
}

type Step = 'upload' | 'format' | 'captions' | 'publishing' | 'done';

const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
};

const FORMAT_OPTIONS = [
  { id: 'post', label: 'Post', labelHe: 'פוסט', icon: ImageIcon, desc: 'Photo or video in the feed', descHe: 'תמונה או וידאו בפיד' },
  { id: 'story', label: 'Story', labelHe: 'סטורי', icon: Play, desc: '24-hour story', descHe: 'סטורי ל-24 שעות' },
  { id: 'reel', label: 'Reel', labelHe: 'ריל', icon: Video, desc: 'Short-form video', descHe: 'וידאו קצר' },
];

export default function BrandPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null);
  const [step, setStep] = useState<Step>('upload');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Format state
  const [format, setFormat] = useState<string>('post');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');

  // Caption state
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);

  // Publish state
  const [publishing, setPublishing] = useState(false);

  const isHe = brandInfo?.language === 'he';
  const dir = isHe ? 'rtl' : 'ltr';

  // Load brand info
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/brands/public?token=${token}`);
        if (!res.ok) { setError('Brand not found'); setLoading(false); return; }
        const data = await res.json();
        setBrandInfo(data);
        setPlatforms(data.connectedPlatforms || []);
      } catch { setError('Failed to load'); }
      setLoading(false);
    })();
  }, [token]);

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    setError(null);

    // Preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMediaType(file.type.startsWith('video/') ? 'video' : 'photo');

    // Upload
    const form = new FormData();
    form.append('file', file);
    form.append('brandToken', token);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Upload failed');
        setPreviewUrl(null);
        setUploading(false);
        return;
      }
      const data = await res.json();
      setMediaId(data.id);
      setMediaType(data.mediaType);
      setStep('format');
    } catch {
      setError('Upload failed');
      setPreviewUrl(null);
    }
    setUploading(false);
  };

  const handleGenerateCaptions = async () => {
    if (!mediaId || platforms.length === 0) return;
    setGeneratingCaptions(true);
    setError(null);

    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandToken: token, mediaId, format, platforms, customPrompt: customPrompt || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to generate captions');
        setGeneratingCaptions(false);
        return;
      }
      const data = await res.json();
      setDrafts(data);
      setStep('captions');
    } catch {
      setError('Failed to generate captions');
    }
    setGeneratingCaptions(false);
  };

  const handlePublish = async () => {
    if (!selectedDraft) return;
    setPublishing(true);
    setStep('publishing');

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: selectedDraft, brandToken: token }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Publish failed');
        setStep('captions');
        setPublishing(false);
        return;
      }
      setStep('done');
    } catch {
      setError('Publish failed');
      setStep('captions');
    }
    setPublishing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error && !brandInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!brandInfo) return null;

  const STYLE_LABELS: Record<string, { label: string; color: string }> = {
    'on-brand': { label: isHe ? 'בסגנון שלך' : 'On-Brand', color: 'bg-violet-100 text-violet-700' },
    'trendy': { label: isHe ? 'טרנדי' : 'Trendy', color: 'bg-amber-100 text-amber-700' },
    'minimal': { label: isHe ? 'מינימלי' : 'Minimal', color: 'bg-gray-100 text-gray-700' },
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8" dir={dir}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-4 text-center">
          <h1 className="font-bold text-gray-900 text-lg">{brandInfo.name}</h1>
          <p className="text-xs text-gray-400 mt-0.5">PostPilot</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6 space-y-4 animate-fade-in">

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3 text-center">{error}</div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 text-center">
              {isHe ? 'העלו תמונה או וידאו' : 'Upload photo or video'}
            </h2>

            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />

            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                {mediaType === 'video' ? (
                  <video src={previewUrl} className="w-full max-h-80 object-contain" controls />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Preview" className="w-full max-h-80 object-contain" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 py-12 border-2 border-dashed border-gray-200 rounded-2xl hover:border-violet-300 hover:bg-violet-50/50 transition-all"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div className="text-start">
                    <p className="font-medium text-gray-700">{isHe ? 'בחרו קובץ' : 'Choose file'}</p>
                    <p className="text-xs text-gray-400">{isHe ? 'תמונה או וידאו עד 100MB' : 'Photo or video, up to 100MB'}</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    if (fileRef.current) {
                      fileRef.current.setAttribute('capture', 'environment');
                      fileRef.current.click();
                      fileRef.current.removeAttribute('capture');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-600"
                >
                  <Camera className="w-4 h-4" />
                  {isHe ? 'צלמו עכשיו' : 'Take photo/video'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Format + Platforms */}
        {step === 'format' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
            {previewUrl && (
              <div className="rounded-xl overflow-hidden bg-gray-100 max-h-48">
                {mediaType === 'video' ? (
                  <video src={previewUrl} className="w-full max-h-48 object-contain" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-contain" />
                )}
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{isHe ? 'פורמט' : 'Format'}</h3>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isVideo = mediaType === 'video';
                  const disabled = opt.id === 'reel' && !isVideo;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => !disabled && setFormat(opt.id)}
                      disabled={disabled}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        format === opt.id
                          ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500'
                          : disabled
                          ? 'border-gray-100 opacity-40 cursor-not-allowed'
                          : 'border-gray-200 hover:border-violet-200 hover:bg-violet-50/50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${format === opt.id ? 'text-violet-600' : 'text-gray-400'}`} />
                      <p className="text-sm font-medium text-gray-900">{isHe ? opt.labelHe : opt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{isHe ? opt.descHe : opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{isHe ? 'פרסום ב:' : 'Publish to:'}</h3>
              <div className="flex gap-2">
                {['instagram', 'facebook', 'tiktok'].map((p) => {
                  const active = platforms.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => setPlatforms(active ? platforms.filter(x => x !== p) : [...platforms, p])}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        active ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:border-violet-200'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{isHe ? 'הערות (אופציונלי)' : 'Notes (optional)'}</h3>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={isHe ? 'למשל: "פוסט על ההנחה החדשה שלנו"' : 'e.g. "Post about our new sale"'}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                rows={2}
                dir={isHe ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('upload')} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleGenerateCaptions}
                disabled={platforms.length === 0 || generatingCaptions}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-semibold transition-colors"
              >
                {generatingCaptions ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {isHe ? '...מייצר' : 'Generating...'}</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> {isHe ? 'צור כיתובים' : 'Generate Captions'}</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Pick from 3 AI options */}
        {step === 'captions' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 text-center">
              {isHe ? 'בחרו סגנון' : 'Pick your style'}
            </h2>

            {drafts.map((draft) => {
              const style = STYLE_LABELS[draft.style] || STYLE_LABELS['on-brand'];
              const selected = selectedDraft === draft.id;
              return (
                <button
                  key={draft.id}
                  onClick={() => setSelectedDraft(draft.id)}
                  className={`w-full text-start bg-white rounded-2xl shadow-sm p-5 border-2 transition-all ${
                    selected ? 'border-violet-500 ring-2 ring-violet-200' : 'border-transparent hover:border-violet-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.color}`}>{style.label}</span>
                    {selected && <Check className="w-5 h-5 text-violet-600" />}
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed mb-2" dir={isHe ? 'rtl' : 'ltr'}>{draft.caption}</p>
                  <div className="flex flex-wrap gap-1">
                    {draft.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs text-violet-500">#{tag}</span>
                    ))}
                  </div>
                </button>
              );
            })}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('format')} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handlePublish}
                disabled={!selectedDraft}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white font-semibold transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
                {isHe ? 'פרסם עכשיו' : 'Publish Now'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Publishing */}
        {step === 'publishing' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-violet-600 mx-auto" />
            <h2 className="text-lg font-semibold text-gray-900">{isHe ? '...מפרסם' : 'Publishing...'}</h2>
            <p className="text-sm text-gray-500">{isHe ? 'שולח לכל הפלטפורמות' : 'Sending to all platforms'}</p>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 'done' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{isHe ? '!פורסם בהצלחה' : 'Published!'}</h2>
            <p className="text-sm text-gray-500">
              {isHe ? 'הפוסט פורסם בכל הפלטפורמות שנבחרו' : 'Your post has been published to all selected platforms.'}
            </p>
            <button
              onClick={() => { setStep('upload'); setMediaId(null); setPreviewUrl(null); setDrafts([]); setSelectedDraft(null); setCustomPrompt(''); }}
              className="bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
            >
              {isHe ? 'פוסט נוסף' : 'Create Another Post'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
