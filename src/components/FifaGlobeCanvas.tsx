/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function FifaGlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x010306, 0.045);

    const parentWidth = canvas.parentElement.clientWidth || window.innerWidth;
    const parentHeight = canvas.parentElement.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(42, parentWidth / parentHeight, 0.1, 200);
    camera.position.set(0, 1.5, 11);

    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth || window.innerWidth;
      const h = canvas.parentElement.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    // ── Lighting ──────────────────────────────────────────────────────────────
    // Ambient base
    const ambient = new THREE.AmbientLight(0x0a1020, 1.0);
    scene.add(ambient);

    // Stadium floodlight — top left (cool blue-white)
    const spot1 = new THREE.SpotLight(0xccddff, 80, 60, Math.PI / 6, 0.3, 1.5);
    spot1.position.set(-8, 14, 6);
    spot1.castShadow = true;
    spot1.shadow.mapSize.set(512, 512);
    scene.add(spot1);

    // Stadium floodlight — top right (warmer)
    const spot2 = new THREE.SpotLight(0xffeedd, 60, 60, Math.PI / 7, 0.4, 1.5);
    spot2.position.set(8, 12, 4);
    spot2.castShadow = true;
    scene.add(spot2);

    // Green ground bounce
    const hemi = new THREE.HemisphereLight(0x7cff2a, 0x020508, 0.15);
    scene.add(hemi);

    // Rim light from behind
    const rimLight = new THREE.DirectionalLight(0x7cff2a, 0.4);
    rimLight.position.set(0, -2, -8);
    scene.add(rimLight);

    // ── Football ─────────────────────────────────────────────────────────────
    const ballGroup = new THREE.Group();
    ballGroup.position.set(0, 0, 0);
    scene.add(ballGroup);

    // Ball sphere
    const ballGeo = new THREE.SphereGeometry(1.8, 64, 64);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.35,
      metalness: 0.05,
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.castShadow = true;
    ball.receiveShadow = true;
    ballGroup.add(ball);

    // Football black pentagon patches (using flat icosahedron projected faces)
    const patchGeo = new THREE.IcosahedronGeometry(1.83, 1);
    const patchMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.5,
      metalness: 0.1,
    });
    const patchMesh = new THREE.Mesh(patchGeo, patchMat);
    // Make it a wireframe-like solid: render only every other face
    patchMesh.scale.setScalar(1.001);
    ballGroup.add(patchMesh);

    // Outer glow halo (emissive plane ring)
    const haloGeo = new THREE.TorusGeometry(2.2, 0.12, 16, 100);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x7cff2a,
      transparent: true,
      opacity: 0.0,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    ballGroup.add(halo);

    // ── Goal Post (right side, behind ball) ──────────────────────────────────
    const postMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.6,
      emissive: 0xffffff,
      emissiveIntensity: 0.08,
    });

    function addPost(x: number, y: number, z: number, w: number, h: number, d: number) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, postMat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      scene.add(mesh);
    }

    // Goal positioned to the right and behind
    const gx = 5.5, gz = -4, gy = -1;
    addPost(gx, gy + 1.5, gz, 0.1, 3, 0.1);       // left post
    addPost(gx + 3, gy + 1.5, gz, 0.1, 3, 0.1);   // right post
    addPost(gx + 1.5, gy + 3.05, gz, 3.1, 0.1, 0.1); // crossbar

    // Net lines (horizontal)
    const netMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 });
    for (let i = 0; i <= 6; i++) {
      const y2 = gy + (i / 6) * 3;
      const pts = [
        new THREE.Vector3(gx, y2, gz),
        new THREE.Vector3(gx + 3, y2, gz),
        new THREE.Vector3(gx + 3, y2, gz - 1.5),
        new THREE.Vector3(gx, y2, gz - 1.5),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      scene.add(new THREE.Line(lineGeo, netMat));
    }
    // Net vertical lines
    for (let i = 0; i <= 8; i++) {
      const x2 = gx + (i / 8) * 3;
      const pts2 = [
        new THREE.Vector3(x2, gy, gz),
        new THREE.Vector3(x2, gy + 3, gz),
      ];
      const lineGeo2 = new THREE.BufferGeometry().setFromPoints(pts2);
      scene.add(new THREE.Line(lineGeo2, netMat));
    }

    // ── Grass Ground Plane ────────────────────────────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x071a07,
      roughness: 0.95,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3.2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Faint grass line markings
    const lineMat = new THREE.LineBasicMaterial({ color: 0x0d3a0d, transparent: true, opacity: 0.6 });
    for (let i = -4; i <= 4; i++) {
      const stripPts = [new THREE.Vector3(-20, -3.19, i * 4), new THREE.Vector3(20, -3.19, i * 4)];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(stripPts), lineMat));
    }

    // ── Floating Grass Particles ──────────────────────────────────────────────
    const grassCount = 400;
    const grassGeo = new THREE.BufferGeometry();
    const grassPos = new Float32Array(grassCount * 3);
    const grassVel = new Float32Array(grassCount * 3);

    for (let i = 0; i < grassCount; i++) {
      grassPos[i * 3]     = (Math.random() - 0.5) * 18;
      grassPos[i * 3 + 1] = (Math.random() - 0.5) * 6 - 1;
      grassPos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
      grassVel[i * 3]     = (Math.random() - 0.5) * 0.003;
      grassVel[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      grassVel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    grassGeo.setAttribute("position", new THREE.BufferAttribute(grassPos, 3));

    const grassMat = new THREE.PointsMaterial({
      color: 0x5aff1a,
      size: 0.04,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    });
    const grassParticles = new THREE.Points(grassGeo, grassMat);
    scene.add(grassParticles);

    // ── Stars / Stadium Crowd Glow particles ─────────────────────────────────
    const starCount = 500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 15 + Math.random() * 20;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      starPos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.4;
      starPos[i * 3 + 2] = r * Math.cos(ph);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffeecc,
      size: 0.06,
      transparent: true,
      opacity: 0.3,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── Energy ring around ball ───────────────────────────────────────────────
    const ringGeo = new THREE.TorusGeometry(2.6, 0.008, 8, 200);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x7cff2a, transparent: true, opacity: 0.25 });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2.5;
    ring1.rotation.z = 0.3;
    scene.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.0, 0.005, 8, 200);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x5dbbff, transparent: true, opacity: 0.12 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2;
    ring2.rotation.z = -0.6;
    scene.add(ring2);

    // ── Mouse parallax ────────────────────────────────────────────────────────
    let mx = 0, my = 0;
    let targetMx = 0, targetMy = 0;
    const onPointer = (e: PointerEvent) => {
      targetMx = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMy = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointer);

    // ── Animation loop ────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!reduced) {
        // Smooth mouse lag
        mx += (targetMx - mx) * 0.04;
        my += (targetMy - my) * 0.04;

        // Ball rotation
        ballGroup.rotation.y = t * 0.18;
        ballGroup.rotation.x = Math.sin(t * 0.3) * 0.08;

        // Ball gentle float
        ballGroup.position.y = Math.sin(t * 0.6) * 0.18;

        // Halo pulse
        haloMat.opacity = 0.04 + Math.sin(t * 1.4) * 0.03;

        // Energy rings orbit
        ring1.rotation.z += 0.003;
        ring2.rotation.z -= 0.002;
        ring1.rotation.x = Math.PI / 2.5 + Math.sin(t * 0.4) * 0.1;

        // Animate grass particles
        const pos = grassGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < grassCount; i++) {
          pos[i * 3]     += grassVel[i * 3]     + Math.sin(t * 0.5 + i) * 0.001;
          pos[i * 3 + 1] += grassVel[i * 3 + 1] + Math.cos(t * 0.4 + i) * 0.0008;
          pos[i * 3 + 2] += grassVel[i * 3 + 2];

          // Reset if out of bounds
          if (Math.abs(pos[i * 3]) > 9) grassVel[i * 3] *= -1;
          if (pos[i * 3 + 1] > 3 || pos[i * 3 + 1] < -4) grassVel[i * 3 + 1] *= -1;
          if (Math.abs(pos[i * 3 + 2]) > 6) grassVel[i * 3 + 2] *= -1;
        }
        grassGeo.attributes.position.needsUpdate = true;

        // Camera parallax
        camera.position.x += (mx * 1.8 - camera.position.x) * 0.025;
        camera.position.y += (-my * 1.0 + 1.5 - camera.position.y) * 0.025;
        camera.lookAt(0, 0.5, 0);
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      renderer.dispose();
      [ballGeo, ballMat, patchGeo, patchMat, haloGeo, haloMat,
       groundGeo, groundMat, grassGeo, grassMat, starGeo, starMat,
       ringGeo, ringMat, ring2Geo, ring2Mat].forEach(o => o.dispose());
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="globe-canvas"
      aria-hidden="true"
      className="absolute inset-0 w-full h-full z-0 pointer-events-auto"
    />
  );
}
