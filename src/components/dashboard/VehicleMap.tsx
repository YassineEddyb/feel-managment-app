import { VehiclePosition } from "@/types/vehicle";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    // Import Leaflet on client-side only
    import("leaflet").then((leaflet) => {
      setL(leaflet);

      // Add CSS for vehicle markers
      const style = document.createElement("style");
      style.textContent = `
        .vehicle-marker {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vehicle-marker img {
          width: 32px;
          height: 20px;
        }
      `;
      document.head.appendChild(style);
    });
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
    <div className="h-[calc(100vh-30px)] w-full rounded-lg overflow-hidden ">
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

          return (
            <Marker
              key={vehicle.id}
              position={[vehicle.lat, vehicle.lng]}
              icon={vehicleIcon}
              eventHandlers={{
                click: () => {
                  // We don't need to call onVehicleClick here as it will be called from the button
                  // This prevents double trigger, letting the popup open first
                },
              }}
            >
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
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
