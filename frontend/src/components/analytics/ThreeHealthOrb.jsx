import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Three.js 3D Health Orb Component
 * Renders an animated glowing emerald metric core representing restaurant health.
 */
export const ThreeHealthOrb = ({ score = 85 }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 160;
    const height = container.clientHeight || 160;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.2;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Glowing Emerald Torus Ring (represents health score arc)
    const torusGeometry = new THREE.TorusGeometry(1.2, 0.14, 16, 64);
    const torusMaterial = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      emissive: 0x052e16,
      roughness: 0.3,
      metalness: 0.7,
      wireframe: false,
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    scene.add(torus);

    // 4. Inner Wireframe Core
    const sphereGeometry = new THREE.IcosahedronGeometry(0.75, 1);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const core = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(core);

    // 5. Ambient Particle Ring
    const particleCount = 48;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.6 + (Math.random() - 0.5) * 0.2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x10b981,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 6. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x34d399, 2.5, 10);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);

    // 7. Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      torus.rotation.x += 0.008;
      torus.rotation.y += 0.012;
      core.rotation.y -= 0.01;
      core.rotation.x -= 0.005;
      particles.rotation.z += 0.004;
      renderer.render(scene, camera);
    };
    animate();

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      torusGeometry.dispose();
      torusMaterial.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, [score]);

  return (
    <div
      ref={mountRef}
      className="w-36 h-36 mx-auto flex items-center justify-center relative cursor-grab active:cursor-grabbing"
      title={`Craviti 3D Health Telemetry - Score: ${score}/100`}
    />
  );
};

