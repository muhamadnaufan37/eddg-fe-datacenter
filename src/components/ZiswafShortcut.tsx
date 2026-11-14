import { FiArrowUpRight, FiHeart } from "react-icons/fi";
import { Link } from "react-router-dom";

const ZiswafShortcut = () => (
  <Link
    to="/digital-data/ziswaf"
    className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:border-emerald-900/70 dark:from-slate-900 dark:to-emerald-950/30 sm:flex-row sm:items-center sm:justify-between sm:p-5"
  >
    <span className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-900/15">
        <FiHeart className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-sm font-extrabold text-slate-900 dark:text-slate-100">
          ZISWAF Digital
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          Salurkan zakat, infaq, sedekah, dan wakaf melalui pembayaran QRIS.
        </span>
      </span>
    </span>
    <span className="inline-flex items-center gap-2 self-end text-xs font-bold text-emerald-700 transition group-hover:gap-3 dark:text-emerald-300 sm:self-auto">
      Buka layanan
      <FiArrowUpRight className="h-4 w-4" />
    </span>
  </Link>
);

export default ZiswafShortcut;
