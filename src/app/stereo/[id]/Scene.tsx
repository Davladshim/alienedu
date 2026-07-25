"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Text, Billboard, Line } from "@react-three/drei";
import { Suspense, useEffect } from "react";
import * as THREE from "three";

interface Point {
  name: string;
  coords: [number, number, number];
}

interface Segment {
  from: string;
  to: string;
  label: string;
  isTarget: boolean;
}

interface Plane {
  name: string;
  anchor: [number, number, number];
}

interface Annotations {
  points: Point[];
  segments: Segment[];
  planes?: Plane[];
  additional?: any[];
}

export interface ActiveLayers {
  planes: boolean;
  points: boolean;
  segments: boolean;
  dimensions: boolean;
  additional: boolean;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        const name = child.name || "";
        let color = "#a7c7e8";
        if (name.includes("alpha")) color = "#d9bfe8";
        if (name.includes("beta")) color = "#a7d8c9";

        child.material = new THREE.MeshStandardMaterial({
          color,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

function PlaneLabels({ planes }: { planes: Plane[] }) {
  return (
    <>
      {planes.map((p) => (
        <Billboard key={p.name} position={p.anchor}>
          <Text fontSize={0.6} color="#7c3aed" anchorX="center" outlineWidth={0.02} outlineColor="#ffffff">
            {p.name}
          </Text>
        </Billboard>
      ))}
    </>
  );
}

function PointsLayer({ points }: { points: Point[] }) {
  return (
    <>
      {points.map((p) => (
        <group key={p.name} position={p.coords}>
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <Billboard position={[0.3, 0.3, 0]}>
            <Text fontSize={0.5} color="#1e293b" anchorX="left">
              {p.name}
            </Text>
          </Billboard>
        </group>
      ))}
    </>
  );
}

function SegmentLines({ points, segments }: { points: Point[]; segments: Segment[] }) {
  function findCoords(name: string) {
    return points.find((p) => p.name === name)?.coords || [0, 0, 0];
  }

  return (
    <>
      {segments.map((s, i) => {
        const from = findCoords(s.from);
        const to = findCoords(s.to);
        return (
          <Line
            key={i}
            points={[from, to]}
            color={s.isTarget ? "#dc2626" : "#334155"}
            lineWidth={2}
          />
        );
      })}
    </>
  );
}

function SegmentEndpointLabels({ points, segments }: { points: Point[]; segments: Segment[] }) {
  function findCoords(name: string) {
    return points.find((p) => p.name === name)?.coords || [0, 0, 0];
  }

  const usedNames = new Set<string>();
  segments.forEach((s) => {
    usedNames.add(s.from);
    usedNames.add(s.to);
  });

  return (
    <>
      {Array.from(usedNames).map((name) => {
        const coords = findCoords(name);
        return (
          <Billboard key={name} position={[coords[0] + 0.3, coords[1] + 0.3, coords[2]]}>
            <Text fontSize={0.5} color="#1e293b" anchorX="left">
              {name}
            </Text>
          </Billboard>
        );
      })}
    </>
  );
}

function DimensionsLayer({ points, segments }: { points: Point[]; segments: Segment[] }) {
  function findCoords(name: string) {
    return points.find((p) => p.name === name)?.coords || [0, 0, 0];
  }

  return (
    <>
      {segments.map((s, i) => {
        const from = new THREE.Vector3(...findCoords(s.from));
        const to = new THREE.Vector3(...findCoords(s.to));
        const mid = from.clone().add(to).multiplyScalar(0.5);

        const direction = to.clone().sub(from).normalize();
        let reference = new THREE.Vector3(0, 1, 0);
        if (Math.abs(direction.dot(reference)) > 0.95) {
          reference = new THREE.Vector3(1, 0, 0);
        }
        const perpendicular = new THREE.Vector3().crossVectors(direction, reference).normalize();
        const offsetPos = mid.clone().add(perpendicular.multiplyScalar(0.5));

        return (
          <Billboard key={i} position={offsetPos.toArray()}>
            <Text
              fontSize={0.5}
              color={s.isTarget ? "#dc2626" : "#0f172a"}
              anchorX="center"
              outlineWidth={0.02}
              outlineColor="#ffffff"
            >
              {s.label}
            </Text>
          </Billboard>
        );
      })}
    </>
  );
}

export default function Scene({
  modelUrl,
  annotations,
  active,
}: {
  modelUrl: string;
  annotations: Annotations;
  active: ActiveLayers;
}) {
  const planes = annotations.planes || [];

  return (
    <Canvas camera={{ position: [10, 8, 15], fov: 45 }} style={{ background: "#f5efe4" }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 10]} intensity={0.8} />
      <Suspense fallback={null}>
        {active.planes && <Model url={modelUrl} />}
        {active.planes && planes.length > 0 && <PlaneLabels planes={planes} />}

        {active.points && <PointsLayer points={annotations.points} />}

        {active.segments && (
          <>
            <SegmentLines points={annotations.points} segments={annotations.segments} />
            {!active.points && (
              <SegmentEndpointLabels points={annotations.points} segments={annotations.segments} />
            )}
          </>
        )}

        {active.dimensions && (
          <DimensionsLayer points={annotations.points} segments={annotations.segments} />
        )}
      </Suspense>
      <OrbitControls />
    </Canvas>
  );
}