import { ReactNode, useRef } from "react";
import Modal from "../../components/Modal";

export default function SceneModal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);

  function capture() {
    const source = host.current?.querySelector("canvas");
    if (!source) return;
    const out = document.createElement("canvas");
    out.width = source.width;
    out.height = source.height;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(source, 0, 0);

    const size = Math.round(out.height * 0.035);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, out.height - size * 2, out.width, size * 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = `${size}px system-ui, sans-serif`;
    ctx.fillText(
      `${title} · Mô phỏng 3D, không phải ảnh thực tế`,
      size,
      out.height - size * 0.7,
    );

    const link = document.createElement("a");
    link.href = out.toDataURL("image/png");
    link.download = "mo-phong-3d.png";
    link.click();
  }

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      className="scene-dialog"
    >
      <div ref={host}>{children}</div>
      <div className="scene-footer">
        <p>Ảnh chụp là mô phỏng do máy tạo, không dùng làm tư liệu lịch sử.</p>
        <button className="button secondary" onClick={capture}>
          Chụp ảnh màn hình
        </button>
      </div>
    </Modal>
  );
}
