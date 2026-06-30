"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import React, { useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface GlobeHeroProps {
  rotationSpeed?: number;
  globeRadius?: number;
  className?: string;
  children?: React.ReactNode;
}

const Globe: React.FC<{
  rotationSpeed: number;
  radius: number;
}> = ({ rotationSpeed, radius }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
      groupRef.current.rotation.x += rotationSpeed * 0.3;
      groupRef.current.rotation.z += rotationSpeed * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          color="#1fe6d0"
          transparent
          opacity={0.12}
          wireframe
        />
      </mesh>
      {/* Inner glow sphere */}
      <mesh>
        <sphereGeometry args={[radius * 0.98, 32, 32]} />
        <meshBasicMaterial
          color="#1fe6d0"
          transparent
          opacity={0.03}
        />
      </mesh>
    </group>
  );
};

/**
 * GlobeHero
 *
 * Full-viewport hero section with a rotating wireframe globe
 * rendered via Three.js. Content is centered on top of the globe.
 *
 * Adapted for Sentinel-IoT: uses sentinel-teal (#1fe6d0) as the
 * wireframe color and dark OLED background matching the SOC aesthetic.
 */
const GlobeHero = React.forwardRef<HTMLDivElement, GlobeHeroProps>(
  (
    {
      rotationSpeed = 0.005,
      globeRadius = 1,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-background",
          className,
        )}
        {...props}
      >
        {/* Content layer */}
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
          {children}
        </div>

        {/* Three.js canvas layer */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <Canvas dpr={[1, 1.5]}>
            <PerspectiveCamera
              makeDefault
              position={[0, 0, 3]}
              fov={75}
            />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            <Globe
              rotationSpeed={rotationSpeed}
              radius={globeRadius}
            />
          </Canvas>
        </div>
      </div>
    );
  },
);

GlobeHero.displayName = "GlobeHero";

export { GlobeHero, type GlobeHeroProps };
