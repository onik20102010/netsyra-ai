"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * 3D Neural Brain Background
 * - Procedural brain core with wireframe + solid shading
 * - Floating crystal pyramids
 * - Dynamic synapse particle network
 * - Mouse-interactive camera
 */
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
    scene.fog = new THREE.FogExp2(0x031822, 0.035);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020d12, 1);
    container.appendChild(renderer.domElement);

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0x0d3b4c, 1.5);
    scene.add(ambientLight);

    const brainGlowLight = new THREE.PointLight(0x00ffff, 4, 15);
    brainGlowLight.position.set(0, 0, 0);
    scene.add(brainGlowLight);

    const goldAccentLight = new THREE.PointLight(0xffb700, 2, 20);
    goldAccentLight.position.set(4, -3, 2);
    scene.add(goldAccentLight);

    // ── Procedural 3D Brain Core ──
    const brainGroup = new THREE.Group();

    function createBrainHemisphere(offsetX: number): THREE.SphereGeometry {
      const geo = new THREE.SphereGeometry(2.2, 64, 64);
      geo.scale(0.8, 0.95, 1.25);

      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const w = pos.getZ(i);

        const fold = Math.sin(u * 7) * Math.cos(v * 7) * Math.sin(w * 7) * 0.15;
        const fineNoise = Math.sin(u * 15 + v * 15) * 0.04;

        pos.setXYZ(
          i,
          u + (fold + fineNoise) * 0.35 + offsetX,
          v + (fold + fineNoise) * 0.35,
          w + (fold + fineNoise) * 0.35
        );
      }
      geo.computeVertexNormals();
      return geo;
    }

    const leftHemisphere = createBrainHemisphere(-0.55);
    const rightHemisphere = createBrainHemisphere(0.55);

    const brainWireframeMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x005f73,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });

    const brainSolidMat = new THREE.MeshPhongMaterial({
      color: 0x0a4d5c,
      emissive: 0x02252e,
      shininess: 80,
      transparent: true,
      opacity: 0.55,
      flatShading: true,
    });

    brainGroup.add(new THREE.Mesh(leftHemisphere, brainWireframeMat));
    brainGroup.add(new THREE.Mesh(rightHemisphere, brainWireframeMat));
    brainGroup.add(new THREE.Mesh(leftHemisphere, brainSolidMat));
    brainGroup.add(new THREE.Mesh(rightHemisphere, brainSolidMat));
    scene.add(brainGroup);

    // ── Floating Crystal Pyramids ──
    const crystals: Array<{
      group: THREE.Group;
      rotSpeedX: number;
      rotSpeedY: number;
      floatOffset: number;
    }> = [];

    const crystalGeo = new THREE.OctahedronGeometry(1.2, 0);

    const crystalMat = new THREE.MeshPhongMaterial({
      color: 0x3a868f,
      emissive: 0x06282d,
      specular: 0x00ffff,
      shininess: 100,
      transparent: true,
      opacity: 0.75,
      flatShading: true,
    });

    const crystalWireMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });

    const crystalPositions = [
      { x: -5.5, y: -0.5, z: 2, scale: 1.3 },
      { x: 5.2, y: 3.2, z: 1, scale: 1.1 },
      { x: 5.8, y: -2.8, z: 2.5, scale: 1.4 },
      { x: -4.8, y: 3.5, z: -1, scale: 0.9 },
      { x: 0, y: -4.2, z: 1.5, scale: 1.2 },
    ];

    crystalPositions.forEach((pos) => {
      const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
      const crystalWire = new THREE.Mesh(crystalGeo, crystalWireMat);

      const group = new THREE.Group();
      group.add(crystalMesh);
      group.add(crystalWire);

      group.position.set(pos.x, pos.y, pos.z);
      group.scale.set(pos.scale, pos.scale * 1.3, pos.scale);
      group.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      scene.add(group);
      crystals.push({
        group,
        rotSpeedX: (Math.random() - 0.5) * 0.008,
        rotSpeedY: (Math.random() - 0.5) * 0.008,
        floatOffset: Math.random() * Math.PI * 2,
      });
    });

    // ── Neural Particles & Synapse Connections ──
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleData: Array<{
      velocity: THREE.Vector3;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 22;
      const y = (Math.random() - 0.5) * 16;
      const z = (Math.random() - 0.5) * 16;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      particleData.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.012,
          (Math.random() - 0.5) * 0.012,
          (Math.random() - 0.5) * 0.012
        ),
      });
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.18,
      transparent: true,
      opacity: 0.95,
    });

    const pointCloud = new THREE.Points(particleGeo, particleMat);
    scene.add(pointCloud);

    // Dynamic connection lines
    const maxConnections = 400;
    const linesGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxConnections * 6);
    linesGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const linesMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.25,
    });

    const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
    scene.add(linesMesh);

    // ── Interactivity ──
    let mouseX = 0;
    let mouseY = 0;

    mouseHandler = (e: MouseEvent) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.0005;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.0005;
    };
    document.addEventListener("mousemove", mouseHandler);

    // ── Animation Loop ──
    const clock = new THREE.Clock();

    function animate() {
      animationId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth camera movement following mouse
      camera.position.x += (mouseX * 8 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 8 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      // Rotate Brain Core
      brainGroup.rotation.y = elapsedTime * 0.12;
      brainGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.15;

      // Pulse Brain Glow
      brainGlowLight.intensity = 3.5 + Math.sin(elapsedTime * 3) * 1.2;

      // Animate Crystals
      crystals.forEach((c) => {
        c.group.rotation.x += c.rotSpeedX;
        c.group.rotation.y += c.rotSpeedY;
        c.group.position.y += Math.sin(elapsedTime * 1.8 + c.floatOffset) * 0.003;
      });

      // Animate Neural Network Nodes & Connections
      const pPos = pointCloud.geometry.attributes.position.array as Float32Array;
      let vertexIdx = 0;

      for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] += particleData[i].velocity.x;
        pPos[i * 3 + 1] += particleData[i].velocity.y;
        pPos[i * 3 + 2] += particleData[i].velocity.z;

        // Bounce off bounds
        if (Math.abs(pPos[i * 3]) > 11) particleData[i].velocity.x *= -1;
        if (Math.abs(pPos[i * 3 + 1]) > 8) particleData[i].velocity.y *= -1;
        if (Math.abs(pPos[i * 3 + 2]) > 8) particleData[i].velocity.z *= -1;

        // Connect nearby particles with lines
        for (let j = i + 1; j < particleCount; j++) {
          const dx = pPos[i * 3] - pPos[j * 3];
          const dy = pPos[i * 3 + 1] - pPos[j * 3 + 1];
          const dz = pPos[i * 3 + 2] - pPos[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 2.8 && vertexIdx < maxConnections * 6) {
            linePositions[vertexIdx++] = pPos[i * 3];
            linePositions[vertexIdx++] = pPos[i * 3 + 1];
            linePositions[vertexIdx++] = pPos[i * 3 + 2];

            linePositions[vertexIdx++] = pPos[j * 3];
            linePositions[vertexIdx++] = pPos[j * 3 + 1];
            linePositions[vertexIdx++] = pPos[j * 3 + 2];
          }
        }
      }

      pointCloud.geometry.attributes.position.needsUpdate = true;
      linesMesh.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }

    animate();

    // ── Resize Handler ──
    resizeHandler = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", resizeHandler);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener("mousemove", mouseHandler);
      window.removeEventListener("resize", resizeHandler);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      // Dispose geometries and materials
      leftHemisphere.dispose();
      rightHemisphere.dispose();
      crystalGeo.dispose();
      particleGeo.dispose();
      linesGeo.dispose();
      brainWireframeMat.dispose();
      brainSolidMat.dispose();
      crystalMat.dispose();
      crystalWireMat.dispose();
      particleMat.dispose();
      linesMat.dispose();
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
