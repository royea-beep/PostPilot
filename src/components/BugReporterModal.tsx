'use client';
import { useState, useRef } from 'react';

export interface BugReportOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
  projectName: string;
  appVersion?: string;
  githubRepo?: string;
  storagesBucket?: string;
  language?: 'he' | 'en' | 'es';
  testerName?: string;
  onSuccess?: (reportId: string) => void;
  onError?: (error: Error) => void;
}

export interface AnnotationMark {
  type: 'arrow' | 'circle' | 'rectangle' | 'text' | 'freehand';
  x: number; y: number;
  x2?: number; y2?: number;
  color: string;
  text?: string;
  points?: Array<{ x: number; y: number }>;
}

interface BreadcrumbEntry { action: string; screen: string; timestamp: number; data?: unknown; }

// Inline breadcrumb tracker (no external dependency)
const _crumbs: BreadcrumbEntry[] = [];
export const trackBugAction = (action: string, screen: string, data?: unknown): void => {
  _crumbs.push({ action, screen, timestamp: Date.now(), data });
  if (_crumbs.length > 10) _crumbs.shift();
};
const _getBreadcrumbs = (): BreadcrumbEntry[] => [..._crumbs];

type Mode = 'select' | 'text' | 'screenshot' | 'audio' | 'video' | 'submitting' | 'done' | 'error';

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export function BugReporterModal({ options, onClose }: { options: BugReportOptions; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('select');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationMark[]>([]);
  const [annotationTool, setAnnotationTool] = useState<'arrow' | 'circle' | 'rectangle' | 'freehand'>('arrow');
  const [annotationColor, setAnnotationColor] = useState('#ef4444');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // ── SCREENSHOT ──────────────────────────────────────────────────────────────
  const takeScreenshot = () => {
    // Use file picker — works across all projects without html2canvas dependency
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setScreenshotBlob(file);
        setScreenshotUrl(URL.createObjectURL(file));
        setMode('screenshot');
      }
    };
    input.click();
  };

  // ── CANVAS ANNOTATION ───────────────────────────────────────────────────────
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    lastPointRef.current = { x, y };
    if (annotationTool === 'freehand') {
      setAnnotations(prev => [...prev, { type: 'freehand', x, y, color: annotationColor, points: [{ x, y }] }]);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (annotationTool === 'freehand') {
      setAnnotations(prev => {
        const last = prev[prev.length - 1];
        if (last?.type === 'freehand') {
          return [...prev.slice(0, -1), { ...last, points: [...(last.points || []), { x, y }] }];
        }
        return prev;
      });
    }
    lastPointRef.current = { x, y };
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    isDrawingRef.current = false;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const start = lastPointRef.current || { x, y };
    if (annotationTool !== 'freehand') {
      setAnnotations(prev => [...prev, { type: annotationTool, x: start.x, y: start.y, x2: x, y2: y, color: annotationColor }]);
    }
  };

  const undoAnnotation = () => setAnnotations(prev => prev.slice(0, -1));
  const clearAnnotations = () => setAnnotations([]);

  // ── AUDIO RECORDING ─────────────────────────────────────────────────────────
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        setAudioBlob(new Blob(chunksRef.current, { type: 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecordingAudio(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      setError('Microphone access denied');
    }
  };

  const stopAudioRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecordingAudio(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ── VIDEO RECORDING ──────────────────────────────────────────────────────────
  const startVideoRecording = async () => {
    try {
      const screenStream = await (navigator.mediaDevices as MediaDevices & { getDisplayMedia: (c: object) => Promise<MediaStream> }).getDisplayMedia({ video: { mediaSource: 'screen' }, audio: false });
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const combinedStream = new MediaStream([...screenStream.getTracks(), ...audioStream.getTracks()]);
      chunksRef.current = [];
      const mr = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' });
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = () => {
        setVideoBlob(new Blob(chunksRef.current, { type: 'video/webm' }));
        combinedStream.getTracks().forEach(t => t.stop());
      };
      mr.start(1000);
      mediaRecorderRef.current = mr;
      setIsRecordingVideo(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
      setTimeout(() => { if (mediaRecorderRef.current?.state === 'recording') stopVideoRecording(); }, 180000);
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      if (err.name === 'NotAllowedError') setError('Screen recording permission denied');
      else setError('Could not start screen recording: ' + (err.message || ''));
    }
  };

  const stopVideoRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecordingVideo(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ── SUBMIT ───────────────────────────────────────────────────────────────────
  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(options.supabaseUrl, options.supabaseAnonKey);

      let reportType: 'text' | 'screenshot' | 'audio' | 'video' | 'screenshot_annotated' = 'text';
      if (videoBlob) reportType = 'video';
      else if (audioBlob) reportType = 'audio';
      else if (screenshotBlob && annotations.length > 0) reportType = 'screenshot_annotated';
      else if (screenshotBlob) reportType = 'screenshot';

      const bucket = options.storagesBucket || 'bug-reports';
      const timestamp = Date.now();
      let screenshotStorageUrl: string | undefined;
      let audioStorageUrl: string | undefined;
      let videoStorageUrl: string | undefined;

      if (screenshotBlob) {
        const { data } = await sb.storage.from(bucket).upload(`screenshots/${timestamp}.png`, screenshotBlob);
        if (data) screenshotStorageUrl = sb.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
      }
      if (audioBlob) {
        const { data } = await sb.storage.from(bucket).upload(`audio/${timestamp}.webm`, audioBlob);
        if (data) audioStorageUrl = sb.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
      }
      if (videoBlob) {
        const { data } = await sb.storage.from(bucket).upload(`videos/${timestamp}.webm`, videoBlob);
        if (data) videoStorageUrl = sb.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
      }

      const breadcrumbs = _getBreadcrumbs();

      const { data: report, error: insertError } = await sb.from('bug_reports').insert({
        description,
        report_type: reportType,
        screenshot_url: screenshotStorageUrl,
        screenshot_annotations: annotations.length > 0 ? annotations : null,
        audio_url: audioStorageUrl,
        video_url: videoStorageUrl,
        page: window.location.pathname,
        app_version: options.appVersion,
        tester_name: options.testerName,
        language: options.language || 'he',
        breadcrumbs,
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          url: window.location.href,
        },
        project: options.projectName,
        status: 'open',
      }).select().single();

      if (insertError || !report) throw insertError || new Error('Insert failed');

      // Trigger AI analysis (fire-and-forget)
      sb.functions.invoke('analyze-bug-report', {
        body: {
          bug_report_id: report.id,
          video_url: videoStorageUrl,
          audio_url: audioStorageUrl,
          screenshot_url: screenshotStorageUrl,
          annotations: annotations.length > 0 ? annotations : undefined,
          language: options.language || 'he',
          tester_name: options.testerName || 'Anonymous',
          app_version: options.appVersion,
          project_name: options.projectName,
          github_repo: options.githubRepo,
          breadcrumbs,
        },
      }).catch(() => {});

      options.onSuccess?.(report.id);
      setMode('done');
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || 'Failed to submit');
      options.onError?.(err);
      setMode('error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const btnStyle = (bg: string): React.CSSProperties => ({
    width: '100%', padding: '12px', borderRadius: 12, background: bg,
    border: 'none', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
  });

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 24px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#0f1623', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: 20, color: 'white' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🐛 דווח על באג</h3>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.5, marginTop: 2 }}>בחר איך לתאר את הבעיה</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Mode: select */}
        {mode === 'select' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {([
                { id: 'text', emoji: '📝', label: 'תיאור טקסט', desc: 'כתוב מה קרה' },
                { id: 'screenshot', emoji: '📸', label: 'Screenshot', desc: 'צלם + סמן' },
                { id: 'audio', emoji: '🎤', label: 'הקלטת קול', desc: 'תאר בקול' },
                { id: 'video', emoji: '🎥', label: 'הקלטת מסך', desc: 'הצג + תאר' },
              ] as const).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => opt.id === 'screenshot' ? takeScreenshot() : setMode(opt.id)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '16px 12px', cursor: 'pointer', textAlign: 'left', color: 'white' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{opt.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="תיאור קצר (אופציונלי)..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', padding: '10px 12px', fontSize: 13, resize: 'none', boxSizing: 'border-box' }}
              rows={2}
            />
            {description && (
              <button onClick={submit} style={{ ...btnStyle('#22c55e'), marginTop: 10 }}>שלח תיאור טקסט</button>
            )}
          </>
        )}

        {/* Mode: screenshot with annotation */}
        {mode === 'screenshot' && screenshotUrl && (
          <>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <img src={screenshotUrl} alt="screenshot" style={{ width: '100%', borderRadius: 10, display: 'block' }} />
              <canvas
                ref={canvasRef} width={800} height={600}
                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair', borderRadius: 10 }}
              />
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <defs>
                  <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill={annotationColor} />
                  </marker>
                </defs>
                {annotations.map((ann, i) => {
                  const x2 = ann.x2 !== undefined ? ann.x2 : ann.x;
                  const y2 = ann.y2 !== undefined ? ann.y2 : ann.y;
                  if (ann.type === 'circle') {
                    const rx = `${Math.abs(x2 - ann.x) * 50}%`;
                    const ry = `${Math.abs(y2 - ann.y) * 50}%`;
                    return <ellipse key={i} cx={`${ann.x * 100}%`} cy={`${ann.y * 100}%`} rx={rx} ry={ry} fill="none" stroke={ann.color} strokeWidth="3" />;
                  }
                  if (ann.type === 'rectangle') {
                    const rx2 = `${Math.min(ann.x, x2) * 100}%`;
                    const ry2 = `${Math.min(ann.y, y2) * 100}%`;
                    const rw = `${Math.abs(x2 - ann.x) * 100}%`;
                    const rh = `${Math.abs(y2 - ann.y) * 100}%`;
                    return <rect key={i} x={rx2} y={ry2} width={rw} height={rh} fill="none" stroke={ann.color} strokeWidth="3" />;
                  }
                  if (ann.type === 'arrow') {
                    return <line key={i} x1={`${ann.x * 100}%`} y1={`${ann.y * 100}%`} x2={`${x2 * 100}%`} y2={`${y2 * 100}%`} stroke={ann.color} strokeWidth="3" markerEnd="url(#arrow)" />;
                  }
                  if (ann.type === 'freehand' && ann.points) {
                    const pts = ann.points.map(p => `${p.x * 100}%,${p.y * 100}%`).join(' ');
                    return <polyline key={i} points={pts} fill="none" stroke={ann.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
                  }
                  return null;
                })}
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              {(['arrow', 'circle', 'rectangle', 'freehand'] as const).map(tool => (
                <button key={tool} onClick={() => setAnnotationTool(tool)}
                  style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: '1px solid', background: annotationTool === tool ? 'rgba(34,197,94,0.2)' : 'transparent', borderColor: annotationTool === tool ? '#22c55e' : 'rgba(255,255,255,0.2)', color: annotationTool === tool ? '#22c55e' : 'rgba(255,255,255,0.7)' }}>
                  {tool === 'arrow' ? '↗ חץ' : tool === 'circle' ? '○ עיגול' : tool === 'rectangle' ? '□ מלבן' : '✏️ ציור'}
                </button>
              ))}
              <button onClick={undoAnnotation} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>↩</button>
              <button onClick={clearAnnotations} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,100,100,0.4)', color: 'rgba(255,100,100,0.8)' }}>🗑</button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setAnnotationColor(c)}
                  style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: annotationColor === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="תאר מה הבעיה (אופציונלי)..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', padding: '10px 12px', fontSize: 13, resize: 'none', boxSizing: 'border-box', marginBottom: 10 }} rows={2} />
            <button onClick={submit} style={btnStyle('#22c55e')}>
              📸 שלח Screenshot{annotations.length > 0 ? ` + ${annotations.length} סימונים` : ''}
            </button>
          </>
        )}

        {/* Mode: audio */}
        {mode === 'audio' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{isRecordingAudio ? '🔴' : '🎤'}</div>
            {isRecordingAudio ? (
              <>
                <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#ef4444' }}>{formatTime(recordingTime)}</p>
                <p style={{ opacity: 0.5, fontSize: 13, marginBottom: 20 }}>מקליט... תאר את הבאג בקול</p>
                <button onClick={stopAudioRecording} style={{ ...btnStyle('#ef4444'), width: 'auto', padding: '14px 32px' }}>⏹ עצור הקלטה</button>
              </>
            ) : audioBlob ? (
              <>
                <p style={{ color: '#22c55e', marginBottom: 12 }}>✅ הוקלטו {formatTime(recordingTime)}</p>
                <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: '100%', marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setAudioBlob(null); startAudioRecording(); }} style={{ ...btnStyle('rgba(255,255,255,0.1)'), flex: 1 }}>🔄 הקלט מחדש</button>
                  <button onClick={submit} style={{ ...btnStyle('#22c55e'), flex: 2 }}>🎤 שלח הקלטה</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ opacity: 0.5, fontSize: 13, marginBottom: 20 }}>לחץ להתחיל הקלטה</p>
                <button onClick={startAudioRecording} style={{ ...btnStyle('#3b82f6'), width: 'auto', padding: '14px 32px' }}>🎤 התחל הקלטה</button>
              </>
            )}
          </div>
        )}

        {/* Mode: video */}
        {mode === 'video' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>{isRecordingVideo ? '🔴' : '🎥'}</div>
            {isRecordingVideo ? (
              <>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>{formatTime(recordingTime)}</p>
                <p style={{ opacity: 0.5, fontSize: 13, marginBottom: 4 }}>מקליט מסך + קול...</p>
                <p style={{ opacity: 0.3, fontSize: 11, marginBottom: 20 }}>הצג את הבאג ותאר בקול מה קורה</p>
                <button onClick={stopVideoRecording} style={{ ...btnStyle('#ef4444'), width: 'auto', padding: '14px 32px' }}>⏹ עצור הקלטה</button>
              </>
            ) : videoBlob ? (
              <>
                <p style={{ color: '#22c55e', marginBottom: 12 }}>✅ הוקלטו {formatTime(recordingTime)}</p>
                <video controls src={URL.createObjectURL(videoBlob)} style={{ width: '100%', borderRadius: 12, marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setVideoBlob(null); startVideoRecording(); }} style={{ ...btnStyle('rgba(255,255,255,0.1)'), flex: 1 }}>🔄 הקלט מחדש</button>
                  <button onClick={submit} style={{ ...btnStyle('#22c55e'), flex: 2 }}>🎥 שלח סרטון</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ opacity: 0.6, fontSize: 13, marginBottom: 8 }}>הקלטת מסך + מיקרופון</p>
                <p style={{ opacity: 0.4, fontSize: 11, marginBottom: 20 }}>תוכנת הדפדפן תבקש הרשאה לשיתוף מסך</p>
                <button onClick={startVideoRecording} style={{ ...btnStyle('#8b5cf6'), width: 'auto', padding: '14px 32px' }}>🎥 התחל הקלטת מסך</button>
              </>
            )}
          </div>
        )}

        {/* Submitting */}
        {submitting && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <p style={{ fontWeight: 600 }}>שולח ומנתח עם AI...</p>
            <p style={{ opacity: 0.4, fontSize: 12, marginTop: 4 }}>זה עלול לקחת כמה שניות</p>
          </div>
        )}

        {/* Done */}
        {mode === 'done' && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: 50, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>הדיווח התקבל!</p>
            <p style={{ opacity: 0.5, fontSize: 13 }}>AI מנתח את הבאג וייצור GitHub issue אוטומטית</p>
            <button onClick={onClose} style={{ ...btnStyle('#22c55e'), width: 'auto', padding: '12px 32px', marginTop: 20 }}>סגור</button>
          </div>
        )}

        {/* Error */}
        {mode === 'error' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>❌</div>
            <p style={{ color: '#ef4444' }}>{error}</p>
            <button onClick={() => setMode('select')} style={{ ...btnStyle('rgba(255,255,255,0.1)'), width: 'auto', padding: '10px 24px', marginTop: 12 }}>נסה שוב</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function BugReporterButton({ options }: { options: BugReportOptions }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9998, width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.9)', border: '2px solid rgba(255,255,255,0.2)', color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
        title="Report a bug"
      >
        🐛
      </button>
      {open && <BugReporterModal options={options} onClose={() => setOpen(false)} />}
    </>
  );
}
