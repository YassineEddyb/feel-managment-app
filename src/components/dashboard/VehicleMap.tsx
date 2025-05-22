import { VehiclePosition } from "@/types/vehicle";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Declare global window property for TypeScript
declare global {
  interface Window {
    vehicleMarkers: { [id: string]: any };
  }
}

// Easing function for smoother animation
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

// Custom marker component to handle animation
const AnimatedMarker = dynamic(
  () =>
    Promise.resolve(({ position, icon, popup, id }: any) => {
      const markerRef = useRef<any>(null);

      useEffect(() => {
        if (markerRef.current) {
          window.vehicleMarkers = window.vehicleMarkers || {};
          window.vehicleMarkers[id] = markerRef.current;
        }

        return () => {
          if (window.vehicleMarkers && window.vehicleMarkers[id]) {
            delete window.vehicleMarkers[id];
          }
        };
      }, [id]);

      return (
        <Marker position={position} icon={icon} ref={markerRef}>
          {popup}
        </Marker>
      );
    }),
  { ssr: false }
);

interface VehicleMapProps {
  vehicles: VehiclePosition[];
  onVehicleClick: (id: string) => void;
}

export default function VehicleMap({
  vehicles,
  onVehicleClick,
}: VehicleMapProps) {
  // Use the first vehicle's position as center if available, otherwise use default
  const mapCenter =
    vehicles.length > 0
      ? { lat: vehicles[0].lat, lng: vehicles[0].lng }
      : { lat: 32.219143, lng: -7.936173 };

  // State for Leaflet library
  const [L, setL] = useState<any>(null);

  // Store previous positions for animation
  const prevPositionsRef = useRef<{ [id: string]: VehiclePosition }>({});

  useEffect(() => {
    // Import Leaflet on client-side only
    import("leaflet").then((leaflet) => {
      setL(leaflet);

      // Initialize global window property for markers
      window.vehicleMarkers = window.vehicleMarkers || {};

      // Add CSS for vehicle markers
      const style = document.createElement("style");
      style.textContent = `
        .vehicle-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease-in-out;
        }
        .vehicle-marker img {
          width: 20px;
          height: 32px;
        }
      `;
      document.head.appendChild(style);
    });
  }, []);

  // Effect for animating vehicle markers when they move
  useEffect(() => {
    if (!L || !window.vehicleMarkers) return;

    // Get current vehicles as a map for easy lookup
    const currentVehiclesMap = vehicles.reduce((acc, vehicle) => {
      acc[vehicle.id] = vehicle;
      return acc;
    }, {} as { [id: string]: VehiclePosition });

    // Check for vehicles that need animation
    Object.entries(window.vehicleMarkers).forEach(([id, marker]) => {
      const prevPos = prevPositionsRef.current[id];
      const currentPos = currentVehiclesMap[id];

      // Skip if we don't have both previous and current positions
      if (!prevPos || !currentPos) return;

      // Skip if position hasn't changed
      if (prevPos.lat === currentPos.lat && prevPos.lng === currentPos.lng)
        return;

      // Calculate animation steps (smoother transition)
      const numSteps = 60; // Increase steps for smoother animation
      let step = 0;

      // Get the initial and target headings, handling the case where they cross the 0/360 boundary
      const initialHeading = prevPos.heading || 0;
      const targetHeading = currentPos.heading || 0;

      // Calculate the shortest path for rotation
      let headingDiff = (targetHeading - initialHeading + 360) % 360;
      if (headingDiff > 180) headingDiff -= 360;

      // Calculate the distance for speed-based animation
      const distance = Math.sqrt(
        Math.pow(currentPos.lat - prevPos.lat, 2) +
          Math.pow(currentPos.lng - prevPos.lng, 2)
      );

      // Duration based on distance (longer distance = slightly longer animation)
      const baseDuration = 1000; // 1 second base duration
      const distanceScale = 5000; // Scaling factor for distance
      const duration = Math.min(baseDuration + distance * distanceScale, 2000); // Cap at 2 seconds
      const timeStep = duration / numSteps;

      let lastTimestamp = 0;

      const animate = (timestamp: number) => {
        if (step >= numSteps) return;

        // Only update if enough time has passed
        if (lastTimestamp === 0) {
          lastTimestamp = timestamp;
        }

        const elapsed = timestamp - lastTimestamp;

        if (elapsed < timeStep) {
          requestAnimationFrame(animate);
          return;
        }

        lastTimestamp = timestamp;

        // Calculate intermediate position with easing
        const progress = step / numSteps;
        // Use cubic easing for more natural movement
        const easedProgress = easeInOutCubic(progress);

        const lat =
          prevPos.lat + (currentPos.lat - prevPos.lat) * easedProgress;
        const lng =
          prevPos.lng + (currentPos.lng - prevPos.lng) * easedProgress;

        // Calculate intermediate heading with easing
        const heading =
          (initialHeading + headingDiff * easedProgress + 360) % 360;

        // Update marker position
        marker.setLatLng([lat, lng]);

        // Update icon with new heading
        const isStatic = isStaticVehicle(id);
        const iconPath = isStatic
          ? "/icons/golf-cart.png"
          : "/icons/golf-cart-3.png";

        marker.setIcon(
          new L.DivIcon({
            html: `<div style="transform: rotate(${heading}deg);"><img src="${iconPath}" alt="Vehicle" /></div>`,
            className: "vehicle-marker",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          })
        );

        step++;
        requestAnimationFrame(animate);
      };

      // Start the animation
      requestAnimationFrame(animate);
    });

    // Update previous positions for next animation
    prevPositionsRef.current = { ...currentVehiclesMap };
  }, [vehicles, L]);

  // Declare the window type extension for TypeScript
  useEffect(() => {
    return () => {
      // Clean up the global object when component unmounts
      if (window.vehicleMarkers) {
        window.vehicleMarkers = {};
      }
    };
  }, []);

  if (!L) {
    return (
      <div className="h-full w-full bg-neutral-100 animate-pulse rounded-lg"></div>
    );
  }

  // Check if a vehicle is static based on its ID
  const isStaticVehicle = (id: string) => id.startsWith("static");

  // Create a vehicle icon with the correct rotation
  const createVehicleIcon = (vehicle: VehiclePosition) => {
    const heading = vehicle.heading || 0;
    const isStatic = isStaticVehicle(vehicle.id);
    const iconPath = isStatic
      ? "/icons/golf-cart.png"
      : "/icons/golf-cart-3.png";

    // Create a div-based icon that we can rotate
    return new L.DivIcon({
      html: `<div style="transform: rotate(${heading}deg);"><img src="${iconPath}" alt="Vehicle" /></div>`,
      className: "vehicle-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={18}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
        />
        {vehicles.map((vehicle) => {
          const vehicleIcon = createVehicleIcon(vehicle);
          const isStatic = isStaticVehicle(vehicle.id);

          const popup = (
            <Popup>
              <div className="p-1">
                <div className="font-bold">{vehicle.name}</div>
                <div className="text-xs text-gray-600">
                  Heading: {Math.round(vehicle.heading || 0)}°
                </div>
                {isStatic && (
                  <div className="text-xs text-blue-600 mt-1">
                    Static Vehicle
                  </div>
                )}
              </div>
            </Popup>
          );

          return (
            <AnimatedMarker
              key={vehicle.id}
              position={[vehicle.lat, vehicle.lng]}
              icon={vehicleIcon}
              popup={popup}
              id={vehicle.id}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
