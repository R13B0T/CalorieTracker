import { useCallback, useEffect, useRef, useState } from 'react';

type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((e: {
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

function getCtor(): (new () => SR) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SR;
    webkitSpeechRecognition?: new () => SR;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(lang = 'en-AU', maxSeconds = 15) {
  const supported = !!getCtor();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SR | null>(null);
  const timerRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    recRef.current?.stop();
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    setError(null);
    setInterim('');
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript + ' ';
        else interimText += r[0].transcript;
      }
      if (finalText) setTranscript((t) => (t + ' ' + finalText).trim());
      setInterim(interimText);
    };
    rec.onend = () => {
      setListening(false);
      setInterim('');
    };
    rec.onerror = (e) => {
      setListening(false);
      setError(
        e.error === 'not-allowed'
          ? 'Microphone permission was denied.'
          : e.error === 'no-speech'
            ? "Didn't catch anything. Try again."
            : `Speech error: ${e.error}`,
      );
    };
    recRef.current = rec;
    rec.start();
    setListening(true);
    timerRef.current = window.setTimeout(() => rec.stop(), maxSeconds * 1000);
  }, [lang, maxSeconds]);

  useEffect(
    () => () => {
      recRef.current?.abort();
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return { supported, listening, transcript, interim, error, start, stop, setTranscript };
}
