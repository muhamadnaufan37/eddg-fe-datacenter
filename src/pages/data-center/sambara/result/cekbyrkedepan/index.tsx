import { Button } from "primereact/button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  reSubmitInfoPkb: () => void;
  tglAkhir?: string;
  tglAkhirSelanjutnya?: string;
}

export default function HitungTagihanModal({
  isOpen,
  onClose,
  reSubmitInfoPkb,
  tglAkhir,
  tglAkhirSelanjutnya,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 text-white"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl w-full max-w-md p-4 animate-fadeIn flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mx-auto">
          <span role="img" aria-label="calculator" className="text-3xl">
            🧮
          </span>
        </div>

        {/* Judul */}
        <h2 className="text-lg font-semibold text-center">
          Hitung Tagihan Selanjutnya
        </h2>

        {/* Deskripsi */}
        <p className="text-sm text-center">
          Kendaraan ini dapat dilakukan hitung pajak untuk tagihan tahun
          selanjutnya.
        </p>

        {/* Tanggal */}
        <div className="flex flex-col sm:flex-row items-stretch justify-between gap-3 border-2 border-gray-700 p-3 rounded-xl">
          <div className="text-start flex-1">
            <p className="text-xs">Tgl. Akhir Pajak</p>
            <p className="font-semibold text-sm">{tglAkhir ?? "-"}</p>
          </div>
          <div className="text-start flex-1">
            <p className="text-xs">Tgl. Akhir Pajak Selanjutnya</p>
            <p className="font-semibold text-sm">
              {tglAkhirSelanjutnya ?? "-"}
            </p>
          </div>
        </div>

        {/* Tombol */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            className="w-full p-button-sm text-xs"
            label="Tidak"
            severity="success"
            size="small"
            onClick={onClose}
            outlined
          />
          <Button
            type="submit"
            className="w-full p-button-sm text-xs"
            label="Ya, hitung"
            severity="success"
            size="small"
            onClick={reSubmitInfoPkb}
          />
        </div>
      </div>
    </div>
  );
}
