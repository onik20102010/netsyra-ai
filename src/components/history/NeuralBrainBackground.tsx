"use client";

export default function NeuralBrainBackground() {
  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex: 0,
        pointerEvents: "none",
        backgroundImage: "url(/history-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
