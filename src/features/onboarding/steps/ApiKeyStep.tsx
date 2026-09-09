import { useState } from 'react';
import { testKey } from '@/lib/ai/claudeClient';
import { AI_ERROR_COPY } from '@/lib/ai/errors';

export function ApiKeyStep({
  value,
  onChange,
  verified,
  onVerified,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  verified: boolean;
  onVerified: (models: string[]) => void;
  compact?: boolean;
}) {
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  async function test() {
    setTesting(true);
    setError(null);
    const res = await testKey(value.trim());
    setTesting(false);
    if (res.ok) onVerified(res.models);
    else setError(AI_ERROR_COPY[res.error.kind]);
  }

  return (
    <div className="flex flex-col gap-4">
      {!compact && (
        <>
          <h2 className="text-2xl font-black">Your Claude API key</h2>
          <p className="text-sm text-bark-700">
            Quokkal talks to Claude directly from your phone. Photo and text logging cost a cent or
            two each and are billed to your own Anthropic account.
          </p>
        </>
      )}
      <div>
        <label className="label" htmlFor="apikey">
          API key
        </label>
        <div className="flex gap-2">
          <input
            id="apikey"
            className="input font-mono text-sm"
            type={show ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-ant-…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <button
            className="btn-secondary px-3"
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide key' : 'Show key'}
          >
            {show ? '🙈' : '👁️'}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="btn-secondary"
          type="button"
          disabled={!value.trim() || testing}
          onClick={test}
        >
          {testing ? 'Checking…' : 'Test key'}
        </button>
        {verified && <span className="text-euc-700 font-bold text-sm">✓ Key works</span>}
        {error && <span className="text-berry-500 text-sm font-semibold">{error}</span>}
      </div>
      <div className="card text-xs text-bark-700 flex flex-col gap-2">
        <p className="font-bold text-bark-900">Keep it safe</p>
        <ul className="list-disc pl-4 flex flex-col gap-1">
          <li>
            Create a key just for Quokkal at console.anthropic.com, and set a monthly spend limit
            there.
          </li>
          <li>
            The key lives only in this browser's storage and is sent only to api.anthropic.com.
          </li>
          <li>Lose the phone? Revoke the key in the console and make a new one.</li>
        </ul>
      </div>
    </div>
  );
}
