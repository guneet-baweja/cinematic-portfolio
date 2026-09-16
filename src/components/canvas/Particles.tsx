import { Sparkles } from "@react-three/drei";

export function Particles({ accent }: { accent: string }) {
  return (
    <Sparkles
      count={60}
      scale={[10, 6, 14]}
      size={1.4}
      speed={0.15}
      opacity={0.35}
      color={accent}
    />
  );
}
