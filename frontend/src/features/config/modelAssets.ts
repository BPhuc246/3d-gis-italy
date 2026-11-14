export const MODEL_ASSETS = {
  colosseum: {
    architecture: [
      "/models/colosseum/colosseum.glb",
    ],
    helmet: [
      "/models/colosseum/gladiator_helmet.glb",
      "/models/colosseum/gladiator_gear.glb",
    ],
  },
  archConstantine: {
    // Ưu tiên bản đúng di tích; nếu chưa có thì dùng triumphal arch GLB tạm thời.
    architecture: [
      "/models/arch-constantine/arch_of_constantine.glb",
      "/models/arch-constantine/triumphal_arch.glb",
    ],
    soldier: [
      "/models/arch-constantine/roman_legionary.glb",
    ],
  },
  vittoriano: {
    architecture: [
      "/models/vittoriano/vittoriano.glb",
    ],
  },
  pantheon: {
    architecture: [
      "/models/pantheon/pantheon.glb",
    ],
  },
  props: {
    candle: [
      "/models/props/candle.glb",
    ],
  },
} as const;
