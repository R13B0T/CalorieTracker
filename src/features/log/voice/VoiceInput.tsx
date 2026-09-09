import { useNavigate } from 'react-router';
import { useSpeechRecognition } from '@/lib/speech/useSpeechRecognition';
import { parseMealText } from '@/lib/ai/claudeClient';
import { useAnalyse } from '../useAnalyse';
import { Thinking } from '../Thinking';

export default function VoiceInput() {
  const nav = useNavigate();
  const sr = useSpeechRecognition('en-AU', 15);
  const { run, cancel, busy, error, retryIn } = useAnalyse();

  async function go() {
    const t = sr.transcript.trim();
    if (!t) return;
    await run({ source: 'voice', rawInput: t, call: (signal) => parseMealText(t, { signal }) });
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button className="btn-ghost -ml-3 px-3" onClick={() => nav(-1)} aria-label="Back">
          ←
        </button>
        <h1 className="text-xl font-black">Say what you ate</h1>
      </div>

      {!sr.supported ? (
        <div className="card flex flex-col gap-3">
          <p className="text-sm text-bark-700">
            This browser doesn't support speech recognition. Safari on iPhone and Chrome on Android
            do. You can still type it.
          </p>
          <button className="btn-primary" onClick={() => nav('/log/text')}>
            Describe it in text
          </button>
        </div>
      ) : (
        <>
          <button
            className={`mx-auto h-32 w-32 rounded-full text-5xl shadow-soft transition active:scale-95 ${sr.listening ? 'bg-berry-500 text-white animate-pulse' : 'bg-euc-500 text-white'}`}
            onClick={sr.listening ? sr.stop : sr.start}
            aria-label={sr.listening ? 'Stop listening' : 'Start listening'}
            disabled={busy}
          >
            {sr.listening ? '⏹' : '🎙️'}
          </button>
          <p className="text-center text-sm text-bark-500">
            {sr.listening
              ? 'Listening… tap to stop (auto-stops at 15 s)'
              : 'Tap and talk. Brands and sizes help.'}
          </p>
          <textarea
            className="input min-h-28"
            value={sr.transcript + (sr.interim ? ` ${sr.interim}` : '')}
            onChange={(e) => sr.setTranscript(e.target.value)}
            placeholder="Your words appear here. Fix anything it misheard."
            disabled={busy}
          />
          {sr.error && (
            <div className="rounded-xl bg-berry-100 text-berry-500 px-4 py-3 text-sm font-semibold">
              {sr.error}
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-berry-100 text-berry-500 px-4 py-3 text-sm font-semibold">
              {error}
              {retryIn && retryIn > 0 ? ` (${retryIn}s)` : ''}
            </div>
          )}
          {busy ? (
            <Thinking onCancel={cancel} />
          ) : (
            <button
              className="btn-primary text-lg"
              disabled={!sr.transcript.trim() || sr.listening || (retryIn ?? 0) > 0}
              onClick={go}
            >
              Work it out
            </button>
          )}
        </>
      )}
    </div>
  );
}
