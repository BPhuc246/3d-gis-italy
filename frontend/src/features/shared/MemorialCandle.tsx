import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function MemorialCandle({
  slug,
  onLit,
}: {
  slug: string;
  onLit?: (lit: boolean) => void;
}) {
  const { user } = useAuth();
  const [total, setTotal] = useState<number | null>(null);
  const [lit, setLit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .candles(slug)
      .then((d) => setTotal(d.total))
      .catch(() => setTotal(null));
  }, [slug]);

  async function light() {
    if (!user) {
      window.location.hash = "#/auth";
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const data = await api.lightCandle(slug);
      setTotal(data.total);
      setLit(true);
      onLit?.(true);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <p className="scene-disclaimer">
        Nến này chỉ là mô phỏng trên màn hình. Không phải ngọn lửa thật và không
        ảnh hưởng đến ngọn lửa thực tế tại công trình.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          className="button secondary"
          disabled={busy || lit}
          onClick={light}
        >
          {lit ? "Đã thắp nến mô phỏng" : "Thắp nến tưởng niệm"}
        </button>
        {total !== null && (
          <span className="text-sm text-slate-600">
            {total} nến đã được thắp
          </span>
        )}
      </div>
      {message && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}
