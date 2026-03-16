'use client';

import { useState, useEffect, useRef, use } from 'react';
import { Upload, Camera, Instagram, Facebook, Play, Check, Loader2, Sparkles, Image as ImageIcon, Video, ArrowRight, ChevronLeft, AlertCircle, ExternalLink, Pencil, X, Copy, Send, Clock, Calendar } from 'lucide-react';
import { TokenWiseBadge } from '@royea/tokenwise/badge-react';
import CopyPostModal from '@/components/CopyPostModal';

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

interface PublishJobResult {
  postId: string;
  platform: string;
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

type Step = 'upload' | 'format' | 'captions' | 'publishing' | 'done';

const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
};

interface PostTypeOption {
  id: string;
  label: string;
  labelHe: string;
  icon: typeof ImageIcon;
  desc: string;
  descHe: string;
  requiresVideo?: boolean;
}

/** Post types available per platform */
const PLATFORM_POST_TYPES: Record<string, PostTypeOption[]> = {
  instagram: [
    { id: 'post', label: 'Feed', labelHe: 'פיד', icon: ImageIcon, desc: 'Photo or video in the feed', descHe: 'תמונה או וידאו בפיד' },
    { id: 'reel', label: 'Reel', labelHe: 'ריל', icon: Video, desc: 'Short-form vertical video', descHe: 'וידאו קצר אנכי', requiresVideo: true },
    { id: 'story', label: 'Story', labelHe: 'סטורי', icon: Play, desc: '24-hour disappearing content', descHe: 'תוכן שנעלם אחרי 24 שעות' },
  ],
  facebook: [
    { id: 'post', label: 'Feed', labelHe: 'פיד', icon: ImageIcon, desc: 'Post on your page', descHe: 'פוסט בדף שלך' },
    { id: 'story', label: 'Story', labelHe: 'סטורי', icon: Play, desc: '24-hour story', descHe: 'סטורי ל-24 שעות' },
  ],
};

/** Get the effective format — for multi-platform we use the most common selection */
function resolveFormat(postTypes: Record<string, string>): string {
  const values = Object.values(postTypes);
  if (values.length === 0) return 'post';
  // Use the first platform's type as the "format" for caption generation
  return values[0] || 'post';
}

/** Format a Date to local datetime-local input value */
function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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
  const [postTypes, setPostTypes] = useState<Record<string, string>>({}); // { instagram: 'reel', facebook: 'post' }
  const [customPrompt, setCustomPrompt] = useState('');

  // Scheduling state
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string>('');

  // Caption state
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);
  const [editedCaption, setEditedCaption] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);

  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishJobResult[]>([]);
  const [showCopyPostModal, setShowCopyPostModal] = useState(false);

  // TokenWise AI cost tracking
  const [aiCostStatus, setAiCostStatus] = useState<'idle' | 'thinking' | 'done'>('idle');
  const [aiInputChars, setAiInputChars] = useState(0);
  const [aiOutputChars, setAiOutputChars] = useState(0);
  const [aiModel, setAiModel] = useState<string>('AI');

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

  // When a draft is selected, initialize editedCaption
  useEffect(() => {
    if (selectedDraft) {
      const draft = drafts.find((d) => d.id === selectedDraft);
      if (draft) {
        setEditedCaption(draft.caption);
        setIsEditing(false);
      }
    }
  }, [selectedDraft, drafts]);

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    setError(null);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMediaType(file.type.startsWith('video/') ? 'video' : 'photo');

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

    // Use the resolved format from per-platform post types
    const effectiveFormat = resolveFormat(postTypes);
    setFormat(effectiveFormat);

    const requestBody = JSON.stringify({ brandToken: token, mediaId, format: effectiveFormat, platforms, customPrompt: customPrompt || undefined });
    setAiInputChars(requestBody.length);
    setAiCostStatus('thinking');

    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to generate captions');
        setGeneratingCaptions(false);
        setAiCostStatus('idle');
        return;
      }
      const data = await res.json();
      setDrafts(data.drafts || data);

      if (data.aiUsage) {
        setAiInputChars(data.aiUsage.inputTokens * 3.5);
        setAiOutputChars(data.aiUsage.outputTokens * 3.5);
        setAiModel(data.aiUsage.model ?? 'AI');
      } else {
        const draftsArr = data.drafts || data;
        const outputSize = draftsArr.reduce((sum: number, d: Draft) => sum + d.caption.length + d.hashtags.join(' ').length, 0);
        setAiOutputChars(outputSize);
      }
      setAiCostStatus('done');

      setStep('captions');
    } catch {
      setError('Failed to generate captions');
      setAiCostStatus('idle');
    }
    setGeneratingCaptions(false);
  };

  const handlePublish = async () => {
    if (!selectedDraft) return;
    setPublishing(true);
    setStep('publishing');
    setError(null);

    // Build scheduled time if enabled
    let scheduledTime: string | undefined;
    if (scheduleEnabled && scheduledFor) {
      const dt = new Date(scheduledFor);
      if (dt <= new Date()) {
        setError(isHe ? 'זמן התזמון חייב להיות בעתיד' : 'Scheduled time must be in the future');
        setStep('captions');
        setPublishing(false);
        return;
      }
      scheduledTime = dt.toISOString();
    }

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: selectedDraft,
          brandToken: token,
          editedCaption: isEditing || editedCaption !== drafts.find((d) => d.id === selectedDraft)?.caption
            ? editedCaption
            : undefined,
          postTypes, // per-platform post types
          scheduledFor: scheduledTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Publish failed');
        setStep('captions');
        setPublishing(false);
        return;
      }

      if (data.scheduled) {
        // Scheduled — go straight to done with a different message
        setPublishResults([]);
        setStep('done');
      } else {
        setPublishResults(data.results || []);
        setStep('done');
      }
    } catch {
      setError('Publish failed');
      setStep('captions');
    }
    setPublishing(false);
  };

  const resetFlow = () => {
    setStep('upload');
    setMediaId(null);
    setPreviewUrl(null);
    setDrafts([]);
    setSelectedDraft(null);
    setEditedCaption('');
    setIsEditing(false);
    setCustomPrompt('');
    setPublishResults([]);
    setAiCostStatus('idle');
    setPostTypes({});
    setScheduleEnabled(false);
    setScheduledFor('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error && !brandInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-[#9ca3af]">{error}</p>
        </div>
      </div>
    );
  }

  if (!brandInfo) return null;

  const STYLE_LABELS: Record<string, { label: string; color: string }> = {
    'on-brand': { label: isHe ? 'בסגנון שלך' : 'On-Brand', color: 'bg-blue-500/10 text-blue-400' },
    'trendy': { label: isHe ? 'טרנדי' : 'Trendy', color: 'bg-[#f59e0b]/10 text-[#f59e0b]' },
    'minimal': { label: isHe ? 'מינימלי' : 'Minimal', color: 'bg-white/5 text-[#9ca3af]' },
  };

  const successResults = publishResults.filter((r) => r.success);
  const failedResults = publishResults.filter((r) => !r.success);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8" dir={dir}>
      {/* Header */}
      <div className="bg-[#111] border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 text-center">
          <h1 className="font-bold text-[#e5e5e5] text-lg">{brandInfo.name}</h1>
          <p className="text-xs text-[#9ca3af]/50 mt-0.5">PostPilot</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6 space-y-4 animate-fade-in">

        {/* Error */}
        {error && (
          <div className="bg-[#ef4444]/10 text-[#ef4444] text-sm rounded-xl p-3 text-center flex items-center justify-center gap-2 border border-[#ef4444]/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#e5e5e5] text-center">
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
              <div className="relative rounded-xl overflow-hidden bg-[#0a0a0a]">
                {mediaType === 'video' ? (
                  <video src={previewUrl} className="w-full max-h-80 object-contain" controls />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Preview" className="w-full max-h-80 object-contain" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 py-12 border-2 border-dashed border-white/10 rounded-2xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                >
                  <Upload className="w-8 h-8 text-[#9ca3af]" />
                  <div className="text-start">
                    <p className="font-medium text-[#e5e5e5]">{isHe ? 'בחרו קובץ' : 'Choose file'}</p>
                    <p className="text-xs text-[#9ca3af]/60">{isHe ? 'תמונה או וידאו עד 10MB' : 'Photo or video, up to 10MB'}</p>
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
                  className="w-full flex items-center justify-center gap-2 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-sm text-[#9ca3af]"
                >
                  <Camera className="w-4 h-4" />
                  {isHe ? 'צלמו עכשיו' : 'Take photo/video'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Format + Platforms + Post Types + Scheduling */}
        {step === 'format' && (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-5">
            {previewUrl && (
              <div className="rounded-xl overflow-hidden bg-[#0a0a0a] max-h-48">
                {mediaType === 'video' ? (
                  <video src={previewUrl} className="w-full max-h-48 object-contain" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-contain" />
                )}
              </div>
            )}

            {/* Platform selection */}
            <div>
              <h3 className="text-sm font-semibold text-[#9ca3af] mb-2">{isHe ? 'פרסום ב:' : 'Publish to:'}</h3>
              <div className="flex gap-2">
                {['instagram', 'facebook'].map((p) => {
                  const active = platforms.includes(p);
                  const Icon = PLATFORM_ICONS[p];
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        if (active) {
                          setPlatforms(platforms.filter(x => x !== p));
                          setPostTypes((prev) => { const next = { ...prev }; delete next[p]; return next; });
                        } else {
                          setPlatforms([...platforms, p]);
                          setPostTypes((prev) => ({ ...prev, [p]: 'post' }));
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        active ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/10 text-[#9ca3af] hover:border-blue-500/30'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      {Icon && <Icon className="w-4 h-4" />}
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Per-platform post type selectors */}
            {platforms.map((p) => {
              const types = PLATFORM_POST_TYPES[p] || [];
              const selectedType = postTypes[p] || 'post';
              const Icon = PLATFORM_ICONS[p];
              return (
                <div key={`type-${p}`}>
                  <h3 className="text-sm font-semibold text-[#9ca3af] mb-2 flex items-center gap-1.5">
                    {Icon && <Icon className="w-4 h-4" />}
                    {p.charAt(0).toUpperCase() + p.slice(1)} — {isHe ? 'סוג פוסט' : 'Post Type'}
                  </h3>
                  <div className={`grid gap-2 ${types.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {types.map((opt) => {
                      const TypeIcon = opt.icon;
                      const isVideoRequired = opt.requiresVideo && mediaType !== 'video';
                      return (
                        <button
                          key={opt.id}
                          onClick={() => !isVideoRequired && setPostTypes((prev) => ({ ...prev, [p]: opt.id }))}
                          disabled={isVideoRequired}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            selectedType === opt.id
                              ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                              : isVideoRequired
                              ? 'border-white/5 opacity-40 cursor-not-allowed'
                              : 'border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5'
                          }`}
                        >
                          <TypeIcon className={`w-5 h-5 mx-auto mb-1 ${selectedType === opt.id ? 'text-blue-400' : 'text-[#9ca3af]'}`} />
                          <p className="text-sm font-medium text-[#e5e5e5]">{isHe ? opt.labelHe : opt.label}</p>
                          <p className="text-xs text-[#9ca3af]/60 mt-0.5">{isHe ? opt.descHe : opt.desc}</p>
                          {isVideoRequired && (
                            <p className="text-xs text-[#ef4444]/60 mt-1">{isHe ? 'דורש וידאו' : 'Requires video'}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Schedule toggle */}
            <div>
              <button
                onClick={() => {
                  setScheduleEnabled(!scheduleEnabled);
                  if (!scheduleEnabled && !scheduledFor) {
                    // Default to 1 hour from now
                    const oneHour = new Date(Date.now() + 60 * 60 * 1000);
                    setScheduledFor(toLocalDateTimeString(oneHour));
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all w-full justify-center ${
                  scheduleEnabled
                    ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]'
                    : 'border-white/10 text-[#9ca3af] hover:border-[#f59e0b]/30'
                }`}
              >
                <Clock className="w-4 h-4" />
                {scheduleEnabled
                  ? (isHe ? 'פרסום מתוזמן פעיל' : 'Scheduled publishing ON')
                  : (isHe ? 'תזמן לפרסום מאוחר' : 'Schedule for later')}
              </button>

              {scheduleEnabled && (
                <div className="mt-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#9ca3af]" />
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    min={toLocalDateTimeString(new Date())}
                    className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#9ca3af] mb-2">{isHe ? 'הערות (אופציונלי)' : 'Notes (optional)'}</h3>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={isHe ? 'למשל: "פוסט על ההנחה החדשה שלנו"' : 'e.g. "Post about our new sale"'}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-[#e5e5e5] placeholder-[#9ca3af]/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                dir={isHe ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('upload')} className="px-4 py-3 rounded-xl border border-white/10 text-[#9ca3af] hover:bg-white/5 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleGenerateCaptions}
                disabled={platforms.length === 0 || generatingCaptions}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold transition-colors"
              >
                {generatingCaptions ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {isHe ? '...מייצר' : 'Generating...'}</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> {isHe ? 'צור כיתובים' : 'Generate Captions'}</>
                )}
              </button>
            </div>

            {aiCostStatus !== 'idle' && (
              <div className="flex justify-center pt-1">
                <TokenWiseBadge status={aiCostStatus} inputChars={aiInputChars} outputChars={aiOutputChars} model={aiModel} />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Pick from 3 AI options + Edit */}
        {step === 'captions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#e5e5e5]">
                {isHe ? 'בחרו סגנון' : 'Pick your style'}
              </h2>
              {aiCostStatus === 'done' && (
                <TokenWiseBadge status="done" inputChars={aiInputChars} outputChars={aiOutputChars} model={aiModel} />
              )}
            </div>

            {drafts.map((draft) => {
              const style = STYLE_LABELS[draft.style] || STYLE_LABELS['on-brand'];
              const selected = selectedDraft === draft.id;
              return (
                <button
                  key={draft.id}
                  onClick={() => setSelectedDraft(draft.id)}
                  className={`w-full text-start bg-[#111] rounded-2xl p-5 border-2 transition-all ${
                    selected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/5 hover:border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.color}`}>{style.label}</span>
                    {selected && <Check className="w-5 h-5 text-blue-400" />}
                  </div>
                  <p className="text-sm text-[#e5e5e5]/80 leading-relaxed mb-2" dir={isHe ? 'rtl' : 'ltr'}>{draft.caption}</p>
                  <div className="flex flex-wrap gap-1">
                    {draft.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs text-blue-400/70">#{tag}</span>
                    ))}
                  </div>
                </button>
              );
            })}

            {/* Caption editor (shown when draft is selected) */}
            {selectedDraft && (
              <div className="bg-[#111] rounded-2xl p-5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#9ca3af] flex items-center gap-1.5">
                    <Pencil className="w-4 h-4" />
                    {isHe ? 'ערכו את הכיתוב' : 'Edit caption'}
                  </h3>
                  {isEditing && (
                    <button
                      onClick={() => {
                        const draft = drafts.find((d) => d.id === selectedDraft);
                        if (draft) setEditedCaption(draft.caption);
                        setIsEditing(false);
                      }}
                      className="text-xs text-[#9ca3af]/60 hover:text-[#9ca3af] flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> {isHe ? 'איפוס' : 'Reset'}
                    </button>
                  )}
                </div>
                <textarea
                  value={editedCaption}
                  onChange={(e) => { setEditedCaption(e.target.value); setIsEditing(true); }}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-[#e5e5e5] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                  dir={isHe ? 'rtl' : 'ltr'}
                  rows={4}
                />
                {isEditing && (
                  <p className="text-xs text-[#f59e0b]">
                    {isHe ? 'הכיתוב שונה מהמקור' : 'Caption modified from original'}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('format')} className="px-4 py-3 rounded-xl border border-white/10 text-[#9ca3af] hover:bg-white/5 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (!selectedDraft) return;
                  setShowCopyPostModal(true);
                }}
                disabled={!selectedDraft}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-white/10 disabled:text-[#9ca3af] text-white font-semibold transition-colors"
              >
                <Copy className="w-5 h-5" />
                {isHe ? 'העתק ופרסם' : 'Copy & Post'}
              </button>
              <button
                onClick={handlePublish}
                disabled={!selectedDraft || publishing}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-[#9ca3af] text-white font-semibold transition-colors"
              >
                {publishing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {isHe ? 'פרסם' : 'Publish'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Publishing */}
        {step === 'publishing' && (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto" />
            <h2 className="text-lg font-semibold text-[#e5e5e5]">
              {isHe ? 'מפרסם...' : 'Publishing...'}
            </h2>
            <p className="text-sm text-[#9ca3af]">
              {isHe ? 'שולח לפלטפורמות שנבחרו' : 'Sending to selected platforms'}
            </p>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 'done' && (
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 space-y-5">
            <div className="text-center space-y-3">
              <div className={`w-16 h-16 ${scheduleEnabled ? 'bg-[#f59e0b]/10 border-[#f59e0b]/20' : 'bg-[#22c55e]/10 border-[#22c55e]/20'} border rounded-full flex items-center justify-center mx-auto`}>
                {scheduleEnabled ? (
                  <Clock className="w-8 h-8 text-[#f59e0b]" />
                ) : (
                  <Check className="w-8 h-8 text-[#22c55e]" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-[#e5e5e5]">
                {scheduleEnabled
                  ? (isHe ? 'תוזמן!' : 'Scheduled!')
                  : publishResults.length > 0
                  ? (isHe ? 'פורסם!' : 'Published!')
                  : (isHe ? 'הכיתוב הועתק!' : 'Caption Copied!')}
              </h2>
              <p className="text-sm text-[#9ca3af]">
                {scheduleEnabled
                  ? (isHe ? `הפוסט יפורסם ב-${new Date(scheduledFor).toLocaleString(isHe ? 'he-IL' : 'en-US')}` : `Your post will be published on ${new Date(scheduledFor).toLocaleString('en-US')}`)
                  : publishResults.length > 0
                  ? (isHe ? 'הפוסט פורסם בהצלחה.' : 'Your post has been published.')
                  : (isHe ? 'הדביקו את הכיתוב בפלטפורמה שלכם.' : 'Paste it into your platform.')}
              </p>
            </div>

            {/* Show publish results if any */}
            {publishResults.length > 0 && (
              <div className="space-y-2">
                {publishResults.filter((r) => r.success).map((r) => (
                  <div key={r.postId} className="flex items-center justify-between bg-[#22c55e]/10 rounded-xl p-3 text-sm border border-[#22c55e]/20">
                    <span className="text-[#22c55e] font-medium capitalize">{r.platform}</span>
                    {r.platformUrl && (
                      <a href={r.platformUrl} target="_blank" rel="noopener noreferrer" className="text-[#22c55e] flex items-center gap-1 hover:underline">
                        <ExternalLink className="w-3 h-3" /> View
                      </a>
                    )}
                  </div>
                ))}
                {publishResults.filter((r) => !r.success).map((r) => (
                  <div key={r.postId} className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl p-3 text-sm text-[#ef4444]">
                    <span className="font-medium capitalize">{r.platform}:</span> {r.errorMessage || 'Failed'}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={resetFlow}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {isHe ? 'פוסט נוסף' : 'Create Another Post'}
            </button>
          </div>
        )}

        {/* Copy & Post Modal */}
        {showCopyPostModal && selectedDraft && (() => {
          const draft = drafts.find((d) => d.id === selectedDraft);
          if (!draft) return null;
          const captionText = editedCaption || draft.caption;
          return (
            <CopyPostModal
              caption={captionText}
              hashtags={draft.hashtags}
              platforms={platforms}
              isHe={isHe}
              onClose={() => setShowCopyPostModal(false)}
              onDone={() => {
                // Track as manual_post
                fetch('/api/publish', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    draftId: selectedDraft,
                    brandToken: token,
                    editedCaption: editedCaption || undefined,
                    manualPost: true,
                  }),
                }).catch(() => { /* best effort tracking */ });
                setShowCopyPostModal(false);
                setStep('done');
              }}
            />
          );
        })()}
      </div>
    </div>
  );
}
