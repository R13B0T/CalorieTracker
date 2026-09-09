import { NavLink } from 'react-router';

const tabs = [
  { to: '/', label: 'Today', icon: '🏠', end: true },
  { to: '/body', label: 'Body', icon: '⚖️' },
  { to: '/log', label: 'Log', icon: '＋', primary: true },
  { to: '/pet', label: 'Quokka', icon: '🐾' },
  { to: '/stats', label: 'Stats', icon: '📈' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-sand-50/95 backdrop-blur border-t border-sand-200 safe-bottom">
      <ul className="grid grid-cols-5 max-w-lg mx-auto">
        {tabs.map((t) => (
          <li key={t.to} className="flex justify-center">
            <NavLink
              to={t.to}
              end={t.end}
              aria-label={t.label}
              className={({ isActive }) =>
                t.primary
                  ? 'relative -mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-euc-500 text-white text-3xl font-black shadow-soft active:scale-95 transition'
                  : `flex flex-col items-center gap-0.5 py-2 px-3 text-[11px] font-bold ${
                      isActive ? 'text-euc-700' : 'text-bark-500'
                    }`
              }
            >
              <span className={t.primary ? '' : 'text-xl leading-none'} aria-hidden>
                {t.icon}
              </span>
              {!t.primary && <span>{t.label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
