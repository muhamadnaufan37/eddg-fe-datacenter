/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { FiArrowUpRight, FiHeart, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface CompletionDetails {
  title: string;
  message: string;
}

interface ZiswafCompletionContextValue {
  showZiswafCompletion: (title: string, message: string) => void;
}

const ZiswafCompletionContext =
  createContext<ZiswafCompletionContextValue | null>(null);

export const ZiswafCompletionProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const navigate = useNavigate();
  const [completion, setCompletion] = useState<CompletionDetails | null>(null);

  const showZiswafCompletion = useCallback(
    (title: string, message: string) => {
      setCompletion({ title, message });
    },
    [],
  );

  const closeModal = useCallback(() => setCompletion(null), []);

  const openZiswaf = useCallback(() => {
    setCompletion(null);
    navigate("/digital-data/ziswaf");
  }, [navigate]);

  return (
    <ZiswafCompletionContext.Provider value={{ showZiswafCompletion }}>
      {children}

      {completion && (
        <div
          className="fixed inset-0 z-80 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ziswaf-completion-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="relative w-full overflow-hidden rounded-t-3xl border border-emerald-200 bg-white shadow-2xl dark:border-emerald-900/70 dark:bg-slate-900 sm:max-w-md sm:rounded-3xl">
            <div className="h-1.5 bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              aria-label="Tutup"
            >
              <FiX className="h-4 w-4" />
            </button>

            <div className="p-6 pt-7 sm:p-7">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                <FiHeart className="h-7 w-7" />
              </div>

              <div className="mt-5 text-center">
                <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                  ZISWAF Digital
                </p>
                <h2
                  id="ziswaf-completion-title"
                  className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white"
                >
                  {completion.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {completion.message}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Nanti saja
                </button>
                <button
                  type="button"
                  onClick={openZiswaf}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  Buka ZISWAF
                  <FiArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ZiswafCompletionContext.Provider>
  );
};

export const useZiswafCompletion = () => {
  const context = useContext(ZiswafCompletionContext);
  if (!context) {
    throw new Error(
      "useZiswafCompletion must be used within ZiswafCompletionProvider",
    );
  }
  return context;
};
