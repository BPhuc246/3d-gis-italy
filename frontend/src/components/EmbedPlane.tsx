type Props = {
  url: string | null;
  title: string;
  credit: string | null;
};

// Khung phẳng nhúng mô hình Sketchfab (giống đoạn iframe embed của Sketchfab)
export default function EmbedPlane({ url, title, credit }: Props) {
  if (!url) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-200 text-sm text-slate-500">
        Công trình này chưa có mô hình nhúng.
      </div>
    );
  }

  return (
    <figure className="overflow-hidden rounded-xl bg-white shadow">
      <div className="relative aspect-video w-full bg-slate-900">
        <iframe
          key={url}
          src={url}
          title={title}
          className="absolute inset-0 h-full w-full"
          frameBorder={0}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
        />
      </div>
      {credit && <figcaption className="px-4 py-2 text-xs text-slate-500">{credit}</figcaption>}
    </figure>
  );
}
