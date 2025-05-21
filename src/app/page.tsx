"use client";

import VehicleDetails from "@/components/dashboard/VehicleDetails";
import VehicleMap from "@/components/dashboard/VehicleMap";
import VehiclesList from "@/components/dashboard/VehiclesList";
import { getAllVehiclesPositions, getVehicleDetails } from "@/lib/api";
import {
  VehicleDetails as VehicleDetailsType,
  VehiclePosition,
} from "@/types/vehicle";
import { useEffect, useRef, useState } from "react";

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store previous positions to calculate heading
  const prevPositionsRef = useRef<{
    [id: string]: { lat: number; lng: number };
  }>({});

  // For vehicle details modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null
  );
  const [vehicleDetails, setVehicleDetails] =
    useState<VehicleDetailsType | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Calculate heading based on previous and current position
  const calculateHeading = (
    prevLat: number,
    prevLng: number,
    currLat: number,
    currLng: number
  ): number => {
    // If the position hasn't changed, return 0 (or previous heading if available)
    if (prevLat === currLat && prevLng === currLng) {
      return 0;
    }

    // Calculate the angle in degrees from the positive y-axis (north)
    // atan2 returns angle in radians from the positive x-axis
    // We convert it to degrees and adjust to make north=0, east=90, etc.
    const dx = currLng - prevLng;
    const dy = currLat - prevLat;
    let heading = Math.atan2(dx, dy) * (180 / Math.PI);

    // Normalize to 0-360 range
    return (heading + 360) % 360;
  };

  // Fetch all vehicles on component mount
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAllVehiclesPositions();

        // Calculate heading for each vehicle by comparing with previous position
        const updatedData = data.map((vehicle) => {
          const prevPos = prevPositionsRef.current[vehicle.id];
          let heading = vehicle.heading || 0; // Keep existing heading if present

          if (prevPos) {
            // Only calculate new heading if position has changed
            if (prevPos.lat !== vehicle.lat || prevPos.lng !== vehicle.lng) {
              heading = calculateHeading(
                prevPos.lat,
                prevPos.lng,
                vehicle.lat,
                vehicle.lng
              );
            }
          }

          // Update previous positions for next calculation
          prevPositionsRef.current[vehicle.id] = {
            lat: vehicle.lat,
            lng: vehicle.lng,
          };

          return {
            ...vehicle,
            heading,
          };
        });

        setVehicles(updatedData);
      } catch (err) {
        console.error("Failed to fetch vehicles:", err);
        setError("Failed to load vehicles. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();

    // Set up polling for real-time updates (every 5 seconds)
    const intervalId = setInterval(fetchVehicles, 2000);

    return () => clearInterval(intervalId);
  }, []);

  // Handle vehicle selection
  const handleVehicleClick = async (vehicleId: string) => {
    console.log("Dashboard: handleVehicleClick called with ID:", vehicleId);

    // First set the dialog to open and indicate loading
    setIsDetailsOpen(true);
    setSelectedVehicleId(vehicleId);
    setIsDetailsLoading(true);

    try {
      // Then fetch the vehicle details
      const details = await getVehicleDetails(vehicleId);
      console.log("Dashboard: Vehicle details fetched:", details);
      setVehicleDetails(details);
    } catch (err) {
      console.error("Failed to fetch vehicle details:", err);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col md:flex-row">
        {/* Left sidebar - Vehicle list */}
        <div className="w-full md:w-80 ">
          <VehiclesList
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onVehicleClick={handleVehicleClick}
            isLoading={isLoading}
          />
        </div>

        {/* Main content - Map */}
        <div className="flex-1 p-4">
          {isLoading && !vehicles.length ? (
            <div className="h-[calc(100vh-140px)] w-full bg-neutral-100 animate-pulse rounded-lg"></div>
          ) : error ? (
            <div className="h-[calc(100vh-140px)] w-full flex items-center justify-center border border-red-200 bg-red-50 rounded-lg">
              <p className="text-red-500">{error}</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="h-[calc(100vh-140px)] w-full flex items-center justify-center border border-neutral-200 bg-neutral-50 rounded-lg">
              <p className="text-neutral-500">No vehicles found</p>
            </div>
          ) : (
            <VehicleMap
              vehicles={vehicles}
              onVehicleClick={handleVehicleClick}
            />
          )}
        </div>
      </main>

      <VehicleDetails
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setVehicleDetails(null);
        }}
        vehicleDetails={vehicleDetails}
        isLoading={isDetailsLoading}
      />
    </div>
  );
}
