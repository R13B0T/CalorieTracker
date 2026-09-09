import { lazy, Suspense } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { PageSpinner } from '@/components/ui/PageSpinner';
import { formatTime } from '@/lib/date';

const DescribeMeal = lazy(() => import('./text/DescribeMeal'));
const MealReview = lazy(() => import('./review/MealReview'));
const PhotoCapture = lazy(() => import('./photo/PhotoCapture'));
const VoiceInput = lazy(() => import('./voice/VoiceInput'));
const BarcodeScanner = lazy(() => import('./barcode/BarcodeScanner'));
const FoodSearch = lazy(() => import('./search/FoodSearch'));

const METHODS = [
  { to: 'photo', emoji: '📸', title: 'Snap a photo', hint: 'Claude itemises what it sees', primary: true },
  { to: 'text', emoji: '✍️', title: 'Describe it', hint: 'Type what you ate' },
  { to: 'voice', emoji: '🎙️', title: 'Say it', hint: 'Talk, then check the text' },
  { to: 'barcode', emoji: '🏷️', title: 'Scan a barcode', hint: 'Most accurate for packaged food' },
  { to: 'search', emoji: '🔍', title: 'Search foods', hint: 'Australian database, no AI needed' },
];

function Picker() {
  const nav = useNavigate();
  const drafts = useLiveQuery(() => db.drafts.orderBy('createdAt').reverse().toArray(), [], []);
  const hasKey = useLiveQuery(() => db.settings.get('me').then((s) => !!s?.apiKey), [], true);
  return (
    <div className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-4">
      <h1 className="text-2xl font-black">Log food</h1>
      {!hasKey && (
        <Link to="/settings/key" className="rounded-xl bg-sun-300/70 px-4 py-3 text-sm font-semibold text-bark-900">
          No Claude key yet. Photo, text and voice need one. Tap to add it, or use barcode and search meanwhile.
        </Link>
      )}
      {drafts.length > 0 && (
        <div className="card flex flex-col gap-2">
          <div className="font-bold text-sm">Saved drafts</div>
          {drafts.map((d) => (
            <button
              key={d.id}
              className="flex items-center gap-3 text-left rounded-xl bg-sand-100 px-3 py-2"
              onClick={() => nav(d.kind === 'photo' ? `photo?draft=${d.id}` : `text?draft=${d.id}`)}
            >
              <span>{d.kind === 'photo' ? '📸' : '✍️'}</span>
              <span className="flex-1 text-sm truncate">{d.text ?? 'Photo waiting for analysis'}</span>
              <span className="text-xs text-bark-500">{formatTime(d.createdAt)}</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {METHODS.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className={`card flex flex-col gap-1 active:scale-[0.98] transition ${m.primary ? 'col-span-2 bg-euc-500 text-white' : ''}`}
          >
            <span className="text-3xl" aria-hidden>{m.emoji}</span>
            <span className="font-black">{m.title}</span>
            <span className={`text-xs ${m.primary ? 'text-euc-100' : 'text-bark-500'}`}>{m.hint}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function LogHub() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route index element={<Picker />} />
        <Route path="text" element={<DescribeMeal />} />
        <Route path="photo" element={<PhotoCapture />} />
        <Route path="voice" element={<VoiceInput />} />
        <Route path="barcode" element={<BarcodeScanner />} />
        <Route path="search" element={<FoodSearch />} />
        <Route path="review" element={<MealReview />} />
      </Routes>
    </Suspense>
  );
}
