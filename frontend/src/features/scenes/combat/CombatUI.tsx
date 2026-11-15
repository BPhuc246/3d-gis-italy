import "./CombatUI.css";
import type { LionState } from "./LionAI";

type CombatUIProps = {
  active: boolean;
  playerHits: number;
  lionHits: number;
  blocking: boolean;
  lionState: LionState;
  paused: boolean;
  result: "victory" | "defeat" | null;
  onStart: () => void;
  onRestart: () => void;
  onExit: () => void;
};

const LION_LABEL: Record<LionState, string> = {
  IDLE: "Đang rình",
  ROAR: "Gầm thét",
  CHARGE: "Lao tới",
  GUARD: "Phòng thủ",
  SCRATCH: "Vồ cào",
  RECOVER: "Hồi sức",
  HURT: "Choáng",
  DEAD: "Gục ngã",
};

export default function CombatUI({
  active,
  playerHits,
  lionHits,
  blocking,
  lionState,
  paused,
  result,
  onStart,
  onRestart,
  onExit,
}: CombatUIProps) {
  if (!active) {
    return (
      <button className="combat-start-button" onClick={onStart}>
        ⚔ Bắt đầu chiến đấu
      </button>
    );
  }

  return (
    <div className="combat-ui">
      <div className="combat-hud">
        <div className="combat-hud-header">
          <strong>COLOSSEUM COMBAT</strong>
          <span className="combat-live">● FIGHT</span>
        </div>

        <div className="combat-stat">
          <div>
            <span>Đòn trúng sư tử</span>
            <strong>{playerHits}/5</strong>
          </div>
          <div className="combat-bars">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < playerHits ? "filled green" : ""} />
            ))}
          </div>
        </div>

        <div className="combat-stat">
          <div>
            <span>Bị sư tử đánh trúng</span>
            <strong>{lionHits}/2</strong>
          </div>
          <div className="combat-bars">
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} className={i < lionHits ? "filled red" : ""} />
            ))}
          </div>
        </div>

        <div className="combat-lion-status">
          <span>SƯ TỬ</span>
          <strong>{LION_LABEL[lionState]}</strong>
        </div>

        <div className="combat-player-status">
          {blocking ? "🛡 ĐANG CHẶN" : "⚔ SẴN SÀNG"}
        </div>
      </div>

      <div className="combat-controls">
        <span>WASD: Di chuyển</span>
        <span>Space: Nhảy</span>
        <span>Shift: Chạy</span>
        <span>Chuột trái: Đánh</span>
        <span>Chuột phải (giữ): Chặn</span>
      </div>

      {paused && !result && (
        <div className="combat-pause" role="status">
          Trận đấu tạm dừng. Nhấp chuột vào màn hình để tiếp tục.
        </div>
      )}

      {result && (
        <div className="combat-result">
          <div className="combat-result-card">
            <div className="combat-result-icon">{result === "victory" ? "🏆" : "💀"}</div>
            <h2>{result === "victory" ? "VICTORY!" : "GAME OVER"}</h2>
            <p>
              {result === "victory"
                ? "Bạn đã đánh bại sư tử Colosseum!"
                : "Bạn đã bị sư tử đánh bại!"}
            </p>
            <div className="combat-result-buttons">
              <button onClick={onRestart}>Chơi lại</button>
              <button onClick={onExit}>Thoát chiến đấu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
