"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function NeuralBrainBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId: number;
    let resizeHandler: () => void;
    let mouseHandler: (e: MouseEvent) => void;

    // ── Scene Setup ──
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── GLSL Fragment Shader for Cosmic Cliffs ──
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec2 uResolution;
      uniform float uTime;
      varying vec2 vUv;

      // ── GLSL Noise Functions ──
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for (int i = 0; i < 5; i++) {
          value += amplitude * noise(p * frequency);
          frequency *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      // ── Diffraction Spikes (JWST style 4-point stars) ──
      float getSpike(vec2 p, vec2 center) {
        vec2 d = p - center;
        // Cross shape calculation
        float spikeX = 1.0 / (1.0 + abs(d.x) * 300.0);
        float spikeY = 1.0 / (1.0 + abs(d.y) * 300.0);
        float spike = max(spikeX, spikeY);

        // Rotate to create 45-degree diagonal spikes too
        vec2 dRot = vec2(d.x + d.y, d.x - d.y) * 0.7071;
        float spikeXRot = 1.0 / (1.0 + abs(dRot.x) * 200.0);
        float spikeYRot = 1.0 / (1.0 + abs(dRot.y) * 200.0);
        return max(spike, max(spikeXRot, spikeYRot));
      }

      void main() {
        vec2 uv = vUv;
        // Aspect ratio correction
        float aspect = uResolution.x / uResolution.y;
        vec2 pos = (uv - 0.5) * vec2(aspect, 1.0);

        // ── 1. Generate the Nebula Cliff (The Terrain) ──
        float terrainHeight = fbm(pos * vec2(4.5, 1.5) + uTime * 0.005);
        float jaggedness = fbm(pos * vec2(8.0, 4.0) + uTime * 0.01);
        float mountainThreshold = terrainHeight * 0.8 + jaggedness * 0.2 + 0.1;

        // ── 2. Coloring the Nebula ──
        vec3 skyColor1 = vec3(0.02, 0.05, 0.15); // Dark deep blue
        vec3 skyColor2 = vec3(0.05, 0.15, 0.40); // Bright cosmic blue
        vec3 skyGradient = mix(skyColor1, skyColor2, uv.y * 0.6);

        // The glowing fiery nebula colors (Orange, Rust, Terracotta)
        vec3 rustColor = vec3(0.9, 0.4, 0.1);
        vec3 darkRust = vec3(0.5, 0.2, 0.1);
        vec3 deepBrown = vec3(0.2, 0.1, 0.05);
        vec3 shadow = vec3(0.05, 0.02, 0.02);

        vec3 cliffColor;
        if (pos.y < mountainThreshold) {
          float cliffNoise = fbm(pos * 5.0 + uTime * 0.002);
          float distanceFromPeak = mountainThreshold - pos.y;

          // Peak gets rust, valleys get dark brown
          float blend = clamp(distanceFromPeak * 6.0, 0.0, 1.0);

          // Add noise variation
          if (cliffNoise > 0.7) {
            cliffColor = mix(rustColor, vec3(0.9, 0.3, 0.05), cliffNoise - 0.7); // Hot spots
          } else {
            vec3 baseCliff = mix(deepBrown, darkRust, blend);
            cliffColor = mix(baseCliff, rustColor, clamp(cliffNoise * 1.5, 0.0, 1.0));
            // Add dark black shadows in the valleys
            cliffColor = mix(shadow, cliffColor, clamp(cliffNoise * 2.0, 0.5, 1.0));
          }
        } else {
          cliffColor = skyGradient;
        }

        // ── 3. Mix in Atmosphere Glow ──
        float glow = 1.0 - abs(pos.y - mountainThreshold) * 3.0;
        glow = clamp(glow, 0.0, 1.0);
        vec3 glowColor = mix(vec3(0.0, 0.2, 0.5), vec3(1.0, 0.5, 0.0), clamp(terrainHeight * 1.5, 0.0, 1.0));
        cliffColor += glow * glowColor * 0.15;

        // ── 4. Stunning JWST Starfield ──
        vec2 starUV = uv * 800.0; // High density for stars
        vec2 starCoord = floor(starUV);
        vec2 starFrac = fract(starUV) - 0.5;

        float rand = hash(starCoord);
        float star = step(0.9992, rand);

        // Large prominent stars with spikes
        float largeStar = step(0.99995, rand);
        float spikes = getSpike(starFrac, vec2(0.0));
        float starBrightness = star * 0.8 + largeStar * spikes * 4.0;

        // Add diffraction glare to the brightest stars
        vec3 starColor = vec3(1.0, 0.95, 0.85); // Slightly warm white
        vec3 finalStar = starColor * starBrightness;

        // ── 5. Final Output ──
        // Ensure stars and light map on top of the nebula correctly using additive blending
        vec3 finalColor = cliffColor + finalStar + (starBrightness * 0.5) * vec3(0.5, 0.8, 1.0);

        // Output
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // ── Build Shader Material ──
    const uniforms = {
      uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      uTime: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.DoubleSide,
    });

    // ── Fullscreen Quad ──
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // ── Mouse Parallax ──
    let mouseX = 0;
    let mouseY = 0;

    mouseHandler = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.05;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.05;
    };
    document.addEventListener("mousemove", mouseHandler);

    // ── Animation Loop ──
    const clock = new THREE.Clock();

    function animate() {
      animationId = requestAnimationFrame(animate);

      // Update time for drifting nebula clouds
      uniforms.uTime.value = clock.getElapsedTime();

      // Subtle parallax and wave shift
      mesh.rotation.y = mouseX;
      mesh.rotation.x = -mouseY * 0.8;
      mesh.position.y = mouseY * 0.5;

      renderer.render(scene, camera);
    }

    animate();

    // ── Resize Handler ──
    resizeHandler = () => {
      if (!container) return;
      uniforms.uResolution.value.set(container.clientWidth, container.clientHeight);
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", resizeHandler);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener("mousemove", mouseHandler);
      window.removeEventListener("resize", resizeHandler);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ zIndex: 0, pointerEvents: "none" }}
    />
  );
}
