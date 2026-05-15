type Theme = "light" | "dark";

interface GlobalTopBarProps {
  theme: Theme;
  toggleTheme: () => void;
}

const GlobalTopBar = ({ theme, toggleTheme }: GlobalTopBarProps) => {
  return (
    <nav className="p-2 flex flex-row items-center justify-between shadow-lg z-10 bg-[#1E88E5] dark:bg-gray-800 w-full fixed top-0 transition-all duration-300 ease-in-out">
      {/* Container untuk Button biar nggak mepet */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 backdrop-blur-sm transition-colors duration-200"
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            // Moon Icon (Light Mode View)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          ) : (
            // Sun Icon (Dark Mode View)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Logo Section */}
      <div className="flex items-center px-2">
        <img
          width="25"
          src="/logo"
          alt="logo"
          className="hover:scale-110 transition-transform duration-200"
        />
      </div>
    </nav>
  );
};

export default GlobalTopBar;
