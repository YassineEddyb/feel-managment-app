import { getVehicleDetails } from "@/lib/api";
import {
  VehicleDetails as VehicleDetailsType,
  VehiclePosition,
} from "@/types/vehicle";
import {
  Battery,
  BatteryMedium,
  Car,
  ChevronDown,
  Clock,
  Gauge,
  MapPin,
  Navigation,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface VehiclesListProps {
  vehicles: VehiclePosition[];
  selectedVehicleId: string | null;
  onVehicleClick: (id: string) => void;
  isLoading: boolean;
}

export default function VehiclesList({
  vehicles,
  selectedVehicleId,
  onVehicleClick,
  isLoading,
}: VehiclesListProps) {
  const [selectedDropdownId, setSelectedDropdownId] = useState<string | null>(
    null
  );
  const [sidebarVehicleDetails, setSidebarVehicleDetails] =
    useState<VehicleDetailsType | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Handle dropdown selection change
  const handleDropdownChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const vehicleId = e.target.value;
    if (vehicleId) {
      setSelectedDropdownId(vehicleId);
      await fetchVehicleDetails(vehicleId);
    } else {
      setSelectedDropdownId(null);
      setSidebarVehicleDetails(null);
    }
  };

  // Fetch vehicle details
  const fetchVehicleDetails = async (vehicleId: string) => {
    if (!vehicleId) return;

    setIsLoadingDetails(true);
    try {
      const details = await getVehicleDetails(vehicleId);
      setSidebarVehicleDetails(details);
      console.log("Sidebar vehicle details fetched:", details);
    } catch (err) {
      console.error("Failed to fetch sidebar vehicle details:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Set up periodic polling for the selected vehicle
  useEffect(() => {
    if (!selectedDropdownId) return;

    // Initial fetch
    fetchVehicleDetails(selectedDropdownId);

    // Set up polling every 5 seconds
    const intervalId = setInterval(() => {
      fetchVehicleDetails(selectedDropdownId);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [selectedDropdownId]);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl text-white font-semibold">Vehicle Details</h2>
        </div>

        {/* Vehicle Selector Dropdown */}
        <div className="mb-4">
          <label
            htmlFor="vehicleSelector"
            className="block text-md font-medium text-gray-100 mb-1"
          >
            Select Vehicle
          </label>
          <div className="relative">
            <select
              id="vehicleSelector"
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 text-white bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedDropdownId || ""}
              onChange={handleDropdownChange}
            >
              <option value="" className="text-lg">
                Select a vehicle...
              </option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {sidebarVehicleDetails ? (
          <div className="space-y-4">
            {/* Vehicle Name Card */}
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="items-center justify-between">
                <div className="flex items-center text-black">
                  <Car className="h-6 w-6 mr-3" />
                  <h3 className="font-bold text-lg ">
                    {sidebarVehicleDetails.name}
                  </h3>
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>
                    {new Date(
                      sidebarVehicleDetails.timestamp
                    ).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-md text-blue-500" />
                Location
              </h4>
              <div className="text-gray-800 text-lg font-bold">
                {sidebarVehicleDetails.lat.toFixed(6)},{" "}
                {sidebarVehicleDetails.lng.toFixed(6)}
              </div>
              {sidebarVehicleDetails.heading !== undefined && (
                <div className="mt-2 text-lg text-gray-600 flex items-center">
                  <Navigation className="h-4 w-4 mr-1 text-gray-500" />
                  <span>
                    Heading: {Math.round(sidebarVehicleDetails.heading)}°
                  </span>
                </div>
              )}
            </div>

            {/* Speed Card */}
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center">
                <Gauge className="h-4 w-4 mr-2 text-md text-blue-500" />
                Speed
              </h4>
              <div className="flex items-center">
                <div className="text-2xl font-bold text-gray-800">
                  {sidebarVehicleDetails.speed}
                </div>
                <div className="ml-2 text-sm text-gray-600">km/h</div>
              </div>
            </div>

            {/* Battery Card */}
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center">
                <Battery className="h-4 w-4 mr-2 text-md text-blue-500" />
                Battery Status
              </h4>
              <div className="flex items-center mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      sidebarVehicleDetails.battery > 50
                        ? "bg-green-500"
                        : sidebarVehicleDetails.battery > 20
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${sidebarVehicleDetails.battery}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-md font-medium text-gray-900">
                  {sidebarVehicleDetails.battery}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                {sidebarVehicleDetails.additionalTelemetry?.battery_voltage !==
                  undefined && (
                  <div className="text-md text-gray-600 flex items-center">
                    <BatteryMedium className="h-3 w-3 mr-1 text-gray-500" />
                    <span>
                      {
                        sidebarVehicleDetails.additionalTelemetry
                          .battery_voltage
                      }{" "}
                      V
                    </span>
                  </div>
                )}

                {sidebarVehicleDetails.additionalTelemetry?.battery_current !==
                  undefined && (
                  <div className="text-md text-gray-600 flex items-center">
                    <Zap className="h-3 w-3 mr-1 text-gray-500" />
                    <span>
                      {
                        sidebarVehicleDetails.additionalTelemetry
                          .battery_current
                      }{" "}
                      A
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : selectedDropdownId ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <Car className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Loading vehicle data...</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <Car className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">
              Please select a vehicle to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
