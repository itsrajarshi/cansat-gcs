import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

interface AttitudeIndicator3DProps {
  roll: number; // degrees
  pitch: number; // degrees
  yaw: number; // degrees
  /**
   * When resetKey changes, the visualization sets the current attitude as the new "zero".
   */
  resetKey: number;
}

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export const AttitudeIndicator3D: React.FC<AttitudeIndicator3DProps> = ({ roll, pitch, yaw, resetKey }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef<number | null>(null);

  const resetQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion()); // identity initially
  const targetQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());

  const targetQuaternion = useMemo(() => {
    // Simple aircraft-like convention: yaw(Y), pitch(X), roll(Z)
    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), degToRad(yaw));
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), degToRad(pitch));
    const qRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), degToRad(roll));
    return qYaw.multiply(qPitch).multiply(qRoll);
  }, [roll, pitch, yaw]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean any previous renderers.
    while (container.firstChild) container.removeChild(container.firstChild);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(container.clientWidth, container.clientHeight);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 8);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0x00d9ff, 1.0);
    dirLight.position.set(4, 6, 10);
    scene.add(dirLight);

    // Horizon grid plane (y=0)
    const horizonGeo = new THREE.PlaneGeometry(12, 12, 20, 20);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.35 });
    const horizon = new THREE.Mesh(horizonGeo, horizonMat);
    horizon.rotateX(-Math.PI / 2);
    scene.add(horizon);

    // Attitude group (aircraft)
    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);

    // Simple aircraft representation: fuselage + wings
    const fuselage = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.8, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x00ff88, metalness: 0.2, roughness: 0.6 })
    );
    group.add(fuselage);

    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.08, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x00d9ff, metalness: 0.2, roughness: 0.5 })
    );
    group.add(wing);

    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.2, roughness: 0.6 })
    );
    tail.position.set(0, 0.35, -1.3);
    group.add(tail);

    // Axis helper
    const axes = new THREE.AxesHelper(3);
    axes.material = new THREE.LineBasicMaterial({ color: 0x888888 });
    scene.add(axes);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    const animate = () => {
      const g = groupRef.current;
      const r = rendererRef.current;
      if (g && r) {
        // Apply relative rotation against the reset quaternion.
        const relative = targetQuatRef.current.clone().multiply(resetQuatRef.current.clone().invert());
        // Interpolate for smooth motion.
        g.quaternion.slerp(relative, 0.12);
      }

      r?.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', onResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Keep target quaternion updated.
  useEffect(() => {
    targetQuatRef.current.copy(targetQuaternion);
  }, [targetQuaternion]);

  // Reset orientation: set current target attitude as new zero.
  useEffect(() => {
    resetQuatRef.current.copy(targetQuaternion);
  }, [resetKey, targetQuaternion]);

  return <div ref={containerRef} className="w-[300px] h-[300px] mx-auto" />;
};

export default AttitudeIndicator3D;

