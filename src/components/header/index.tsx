import { FiMoon, FiSun } from "react-icons/fi";

type Theme = "light" | "dark";

interface GlobalTopBarProps {
  theme: Theme;
  toggleTheme: () => void;
}

const GlobalTopBar = ({ theme, toggleTheme }: GlobalTopBarProps) => {
  return (
    <nav className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#e2eaf5]/80 bg-white/85 px-4 backdrop-blur-md transition-all duration-300 dark:border-[#526d82]/40 dark:bg-[#27374d]/90 sm:px-6">
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2373f4] to-[#65d0f4] p-1.5 shadow-md shadow-[#2373f4]/20">
            <img
              src="/logo.svg"
              alt="SIPANDA Logo"
              className="h-full w-full object-contain brightness-0 invert"
            />
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-[#dde6ed]">
            SIPANDA
          </span>
        </a>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-xs transition hover:border-[#2373f4]/50 hover:bg-[#eef5ff] hover:text-[#2373f4] dark:border-[#526d82]/60 dark:bg-[#27374d] dark:text-[#dde6ed] dark:hover:border-[#65d0f4] dark:hover:bg-[#33465e] dark:hover:text-[#65d0f4]"
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <FiMoon className="h-4 w-4" />
          ) : (
            <FiSun className="h-4 w-4 text-[#f2f7a0]" />
          )}
        </button>
      </div>
    </nav>
  );
};

export default GlobalTopBar;
