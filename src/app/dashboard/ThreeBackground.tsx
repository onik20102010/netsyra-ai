"use client";
import { useEffect, useRef } from "react";

export default function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // dynamically import three.js ONLY on the client
    import("three").then((THREE) => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      // ... paste your entire Three.js initialisation code here ...
      // (replace the THREE variable references as needed)
    });
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}