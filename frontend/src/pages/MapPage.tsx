import { useEffect, useState } from 'react';
import { api, EmbedKind, RegionDetail } from '../lib/api';
import EmbedPlane from '../components/EmbedPlane';

const DEFAULT_REGION = 'roma-trung-tam';

type Props = { slug: string | null };

export default function MapPage({ slug }: Props) {
  const [region, setRegion] = useState<RegionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<EmbedKind>('exterior');

  useEffect(() => {
    api.getRegion(DEFAULT_REGION).then(setRegion).catch((e: Error) => setError(e.message));
  }, []);

  // Đổi công trình thì quay về mô hình bên ngoài
  useEffect(() => {
    setKind('exterior');
  }, [slug]);

  if (error) return <p className="p-6 text-red-600">Lỗi: {error}</p>;
  if (!region) return <p className="p-6 text-slate-500">Đang tải...</p>;

  const selected = region.destinations.find((d) => d.slug === slug) ?? region.destinations[0];
  const hasInterior = selected.embeds.some((e) => e.kind === 'interior');
  const current = selected.embeds.find((e) => e.kind === kind) ?? selected.embeds[0];

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">{region.name}</h1>
        {region.description && <p className="mt-2 text-slate-600">{region.description}</p>}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-4">
        <aside className="rounded-2xl bg-white p-3 shadow lg:col-span-1">
          <ul className="space-y-1">
            {region.destinations.map((d) => (
              <li key={d.slug}>
                <a
                  href={`#/map/${d.slug}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    d.slug === selected.slug
                      ? 'bg-amber-50 font-medium text-amber-800'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {d.name}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <section className="space-y-4 lg:col-span-3">
          {hasInterior && (
            <div className="inline-flex rounded-lg bg-white p-1 shadow">
              {(['exterior', 'interior'] as const).map((k) => {
                const exists = selected.embeds.some((e) => e.kind === k);
                return (
                  <button
                    key={k}
                    disabled={!exists}
                    onClick={() => setKind(k)}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${
                      kind === k ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {k === 'exterior' ? 'Bên ngoài' : 'Bên trong'}
                  </button>
                );
              })}
            </div>
          )}

          <EmbedPlane
            url={current?.embedUrl ?? null}
            title={`${selected.name} (${kind === 'interior' ? 'bên trong' : 'bên ngoài'})`}
            credit={current?.credit ?? null}
          />

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
              {selected.categoryLabel}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-800">{selected.name}</h2>
            <p className="mt-1 text-xs text-slate-500">{selected.address}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{selected.description}</p>
            <a
              href={`#/d/${selected.slug}`}
              className="mt-4 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Xem chi tiết
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
