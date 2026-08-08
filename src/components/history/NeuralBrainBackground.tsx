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
    scene.fog = new THREE.FogExp2(0x02121c, 0.025);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0.5, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x02121c, 1);
    container.appendChild(renderer.domElement);

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0x003344, 0.8);
    scene.add(ambientLight);

    const brainGlowLight = new THREE.PointLight(0x00ffff, 6, 18);
    brainGlowLight.position.set(0, 1, 0);
    scene.add(brainGlowLight);

    const backLight = new THREE.PointLight(0x004466, 3, 10);
    backLight.position.set(-2, 0, -4);
    scene.add(backLight);

    // ── Infinite Grid Floor ──
    const gridHelper = new THREE.GridHelper(30, 40, 0x00aaff, 0x004466);
    gridHelper.position.y = -3.2;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    scene.add(gridHelper);

    // ── Procedural 3D Brain Core ──
    const brainGroup = new THREE.Group();

    function createBrainHemisphere(offsetX: number): THREE.SphereGeometry {
      const geo = new THREE.SphereGeometry(2.1, 64, 64);
      geo.scale(0.75, 1, 1.2);

      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const w = pos.getZ(i);

        const fold = Math.sin(u * 6.5) * Math.cos(v * 8) * Math.sin(w * 6) * 0.18;
        const fineNoise = Math.sin(u * 18 + v * 12) * 0.03;

        pos.setXYZ(
          i,
          u + (fold + fineNoise) * 0.4 + offsetX,
          v + (fold + fineNoise) * 0.4,
          w + (fold + fineNoise) * 0.4
        );
      }
      geo.computeVertexNormals();
      return geo;
    }

    const leftHemisphere = createBrainHemisphere(-0.55);
    const rightHemisphere = createBrainHemisphere(0.55);

    const brainWireframeMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x007799,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });

    const brainSolidMat = new THREE.MeshPhongMaterial({
      color: 0x005566,
      emissive: 0x001a22,
      shininess: 60,
      transparent: true,
      opacity: 0.4,
      flatShading: false,
    });

    brainGroup.add(new THREE.Mesh(leftHemisphere, brainWireframeMat));
    brainGroup.add(new THREE.Mesh(rightHemisphere, brainWireframeMat));
    brainGroup.add(new THREE.Mesh(leftHemisphere, brainSolidMat));
    brainGroup.add(new THREE.Mesh(rightHemisphere, brainSolidMat));
    scene.add(brainGroup);

    // ── Floating Crystal Pyramids (Tetrahedrons) ──
    const crystals: Array<{
      group: THREE.Group;
      rotSpeedX: number;
      rotSpeedY: number;
      floatOffset: number;
    }> = [];

    // Geometry: Sharp Tetrahedrons
    const crystalGeo = new THREE.TetrahedronGeometry(1.0, 0);

    // Outer transparent cyan shell
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x00ddff,
      emissive: 0x004455,
      metalness: 0.1,
      roughness: 0.2,
      transparent: true,
      opacity: 0.3,
      wireframe: false,
    });

    // Inner solid green/moss core
    const crystalMatInner = new THREE.MeshPhongMaterial({
      color: 0x00ff88,
      emissive: 0x226644,
      shininess: 20,
    });

    const crystalWireMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });

    const crystalPositions = [
      { x: -6, y: 0.5, z: 2.5, scale: 1.4 },
      { x: 5.5, y: 3.5, z: -1, scale: 1.2 },
      { x: 6.2, y: -2.5, z: 1.5, scale: 1.5 },
      { x: -5.5, y: -3.5, z: -2, scale: 1.1 },
      { x: -4, y: 4, z: -2.5, scale: 0.9 },
      { x: 4, y: -4, z: 3, scale: 1.3 },
      { x: 0, y: -4.8, z: 1, scale: 1.2 },
    ];

    crystalPositions.forEach((pos) => {
      const group = new THREE.Group();

      // Outer Teal Shell
      const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
      crystalMesh.scale.set(1, 1.3, 1);

      // Inner Green Moss Core
      const innerMesh = new THREE.Mesh(crystalGeo, crystalMatInner);
      innerMesh.scale.set(0.7, 0.9, 0.7);

      // Outer Wireframe
      const crystalWire = new THREE.Mesh(crystalGeo, crystalWireMat);
      crystalWire.scale.set(1, 1.3, 1);

      group.add(crystalMesh);
      group.add(innerMesh);
      group.add(crystalWire);

      group.position.set(pos.x, pos.y, pos.z);
      group.scale.set(pos.scale, pos.scale * 1.3, pos.scale);
      group.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      scene.add(group);
      crystals.push({
        group,
        rotSpeedX: (Math.random() - 0.5) * 0.01,
        rotSpeedY: (Math.random() - 0.5) * 0.01,
        floatOffset: Math.random() * Math.PI * 2,
      });
    });

    // ── Neural Particles, Glowing Nodes & Synapse Connections ──

    // 1. Create a canvas texture for the glowing nodes
    function createGlowTexture() {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(canvas);
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.2, "rgba(100, 240, 255, 1)");
      gradient.addColorStop(0.6, "rgba(0, 180, 255, 0.6)");
      gradient.addColorStop(1, "rgba(0, 100, 200, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    }

    const glowTexture = createGlowTexture();

    const particleCount = 160;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleData: Array<{
      velocity: THREE.Vector3;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 14;
      const z = (Math.random() - 0.5) * 16 - 2;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      particleData.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.008
        ),
      });
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Glowing Sprite Nodes
    const spriteMat = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0x88ffff,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });

    const sprites: THREE.Sprite[] = [];
    for (let i = 0; i < particleCount; i++) {
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.4, 0.4, 1);
      sprite.position.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      scene.add(sprite);
      sprites.push(sprite);
    }

    // Dynamic connection lines
    const maxConnections = 500;
    const linesGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxConnections * 6);
    linesGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const linesMat = new THREE.LineBasicMaterial({
      color: 0x00ddff,
      transparent: true,
      opacity: 0.15,
    });

    const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
    scene.add(linesMesh);

    // ── Interactivity ──
    let mouseX = 0;
    let mouseY = 0;

    mouseHandler = (e: MouseEvent) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.0004;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.0004;
    };
    document.addEventListener("mousemove", mouseHandler);

    // ── Animation Loop ──
    const clock = new THREE.Clock();

    function animate() {
      animationId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth camera movement following mouse
      camera.position.x += (mouseX * 6 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 4 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      // Rotate Brain Core
      brainGroup.rotation.y = elapsedTime * 0.08;
      brainGroup.position.y = Math.sin(elapsedTime * 0.8) * 0.15;

      // Pulse Brain Glow
      brainGlowLight.intensity = 4.5 + Math.sin(elapsedTime * 2.5) * 1.5;

      // Animate Crystals
      crystals.forEach((c) => {
        c.group.rotation.x += c.rotSpeedX;
        c.group.rotation.y += c.rotSpeedY;
        c.group.position.y += Math.sin(elapsedTime * 1.2 + c.floatOffset) * 0.004;
      });

      // Animate Neural Network Nodes & Connections
      const pPos = particleGeo.attributes.position.array as Float32Array;
      let vertexIdx = 0;

      for (let i = 0; i < particleCount; i++) {
        pPos[i * 3] += particleData[i].velocity.x;
        pPos[i * 3 + 1] += particleData[i].velocity.y;
        pPos[i * 3 + 2] += particleData[i].velocity.z;

        // Update Sprite positions
        sprites[i].position.set(pPos[i * 3], pPos[i * 3 + 1], pPos[i * 3 + 2]);

        // Bounce off bounds
        if (Math.abs(pPos[i * 3]) > 12) particleData[i].velocity.x *= -1;
        if (Math.abs(pPos[i * 3 + 1]) > 8) particleData[i].velocity.y *= -1;
        if (Math.abs(pPos[i * 3 + 2]) > 8) particleData[i].velocity.z *= -1;

        // Connect nearby particles with lines
        for (let j = i + 1; j < particleCount; j++) {
          const dx = pPos[i * 3] - pPos[j * 3];
          const dy = pPos[i * 3 + 1] - pPos[j * 3 + 1];
          const dz = pPos[i * 3 + 2] - pPos[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 2.5 && vertexIdx < maxConnections * 6) {
            linePositions[vertexIdx++] = pPos[i * 3];
            linePositions[vertexIdx++] = pPos[i * 3 + 1];
            linePositions[vertexIdx++] = pPos[i * 3 + 2];

            linePositions[vertexIdx++] = pPos[j * 3];
            linePositions[vertexIdx++] = pPos[j * 3 + 1];
            linePositions[vertexIdx++] = pPos[j * 3 + 2];
          }
        }
      }

      particleGeo.attributes.position.needsUpdate = true;
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
      crystalMatInner.dispose();
      crystalWireMat.dispose();
      spriteMat.dispose();
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