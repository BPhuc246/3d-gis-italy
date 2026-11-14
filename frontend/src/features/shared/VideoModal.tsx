import Modal from "../../components/Modal";

export default function VideoModal({
  title,
  src,
  credit,
  onClose,
}: {
  title: string;
  src: string;
  credit: string | null;
  onClose: () => void;
}) {
  return (
    <Modal
      title={title}
      subtitle="VIDEO"
      onClose={onClose}
      className="video-dialog"
    >
      {src ? (
        <video
          key={src}
          src={src}
          controls
          playsInline
          preload="metadata"
          className="w-full rounded-lg bg-black"
        />
      ) : (
        <p className="text-slate-500">Chưa có video cho mục này.</p>
      )}
      {credit && <p className="mt-2 text-xs text-slate-500">{credit}</p>}
    </Modal>
  );
}
