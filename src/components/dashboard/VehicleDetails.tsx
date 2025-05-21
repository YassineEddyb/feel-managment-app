import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VehicleDetails as VehicleDetailsType } from "@/types/vehicle";
import {
  AlertCircle,
  Anchor,
  ArrowUpDown,
  Battery,
  Clock,
  Droplets,
  Fuel,
  Gauge,
  Info,
  MapPin,
  Navigation,
  Power,
  Ruler,
  Satellite,
  Thermometer,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface VehicleDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleDetails: VehicleDetailsType | null;
  isLoading: boolean;
}

// Helper function to format timestamp
const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

// Helper function to format telemetry values with units
const formatTelemetryValue = (key: string, value: any): string => {
  if (value === undefined || value === null) return "N/A";

  // Format based on the field name
  switch (key.toLowerCase()) {
    case "altitude":
      return `${value} m`;
    case "temperature":
      return `${value} °C`;
    case "humidity":
      return `${value} %`;
    case "fuel":
      return `${value} %`;
    case "odometer":
    case "distance":
      return `${value} km`;
    case "satellites":
      return value.toString();
    case "accuracy":
      return `${value} m`;
    case "hdop":
      return value.toString();
    case "ignition":
      return value ? "On" : "Off";
    case "engine":
      return value ? "Running" : "Off";
    default:
      return value.toString();
  }
};

// Helper to get icon for telemetry field
const getTelemetryIcon = (key: string) => {
  switch (key.toLowerCase()) {
    case "temperature":
      return <Thermometer className="h-5 w-5 mr-2 text-neutral-500" />;
    case "altitude":
      return <ArrowUpDown className="h-5 w-5 mr-2 text-neutral-500" />;
    case "satellites":
      return <Satellite className="h-5 w-5 mr-2 text-neutral-500" />;
    case "fuel":
      return <Fuel className="h-5 w-5 mr-2 text-neutral-500" />;
    case "ignition":
    case "engine":
      return <Power className="h-5 w-5 mr-2 text-neutral-500" />;
    case "odometer":
    case "distance":
      return <Ruler className="h-5 w-5 mr-2 text-neutral-500" />;
    case "humidity":
      return <Droplets className="h-5 w-5 mr-2 text-neutral-500" />;
    case "hdop":
    case "accuracy":
      return <Anchor className="h-5 w-5 mr-2 text-neutral-500" />;
    default:
      return <Info className="h-5 w-5 mr-2 text-neutral-500" />;
  }
};

export default function VehicleDetails({
  isOpen,
  onClose,
  vehicleDetails,
  isLoading,
}: VehicleDetailsProps) {
  const [showAllTelemetry, setShowAllTelemetry] = useState(false);

  // Log when the component updates
  useEffect(() => {
    if (isOpen) {
      console.log("Vehicle details dialog opened", {
        isOpen,
        vehicleDetails,
        isLoading,
      });
    }
  }, [isOpen, vehicleDetails, isLoading]);

  // Get additional telemetry fields
  const getAdditionalTelemetry = () => {
    if (!vehicleDetails?.additionalTelemetry) return [];

    return Object.entries(vehicleDetails.additionalTelemetry)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b));
  };

  const additionalTelemetry = vehicleDetails ? getAdditionalTelemetry() : [];

  // Handle dialog state changes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {vehicleDetails ? vehicleDetails.name : "Vehicle Details"}
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col space-y-3 py-4">
            <div className="h-6 bg-neutral-100 animate-pulse rounded"></div>
            <div className="h-6 bg-neutral-100 animate-pulse rounded"></div>
            <div className="h-6 bg-neutral-100 animate-pulse rounded"></div>
          </div>
        ) : vehicleDetails ? (
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-neutral-500" />
              <span className="font-medium">Location:</span>
              <span className="ml-2 text-sm">
                {vehicleDetails.lat.toFixed(6)}, {vehicleDetails.lng.toFixed(6)}
              </span>
            </div>

            <div className="flex items-center">
              <Gauge className="h-5 w-5 mr-2 text-neutral-500" />
              <span className="font-medium">Speed:</span>
              <span className="ml-2">{vehicleDetails.speed} km/h</span>
            </div>

            {vehicleDetails.heading !== undefined && (
              <div className="flex items-center">
                <Navigation className="h-5 w-5 mr-2 text-neutral-500" />
                <span className="font-medium">Heading:</span>
                <span className="ml-2">
                  {Math.round(vehicleDetails.heading)}°
                </span>
              </div>
            )}

            <div className="flex items-center">
              <Battery className="h-5 w-5 mr-2 text-neutral-500" />
              <span className="font-medium">Battery:</span>
              <div className="ml-2 w-24 bg-neutral-200 rounded-full h-2.5 dark:bg-neutral-700">
                <div
                  className={`h-2.5 rounded-full ${
                    vehicleDetails.battery > 20 ? "bg-green-600" : "bg-red-600"
                  }`}
                  style={{ width: `${vehicleDetails.battery}%` }}
                ></div>
              </div>
              <span className="ml-2">{vehicleDetails.battery}%</span>
            </div>

            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-neutral-500" />
              <span className="font-medium">Last updated:</span>
              <span className="ml-2">
                {formatTimestamp(vehicleDetails.timestamp)}
              </span>
            </div>

            {additionalTelemetry.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-neutral-700">
                    Additional Telemetry
                  </h3>
                  <button
                    onClick={() => setShowAllTelemetry(!showAllTelemetry)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showAllTelemetry ? "Show Less" : "Show All"}
                  </button>
                </div>

                <div className="space-y-2 border-t pt-2">
                  {additionalTelemetry
                    .slice(0, showAllTelemetry ? undefined : 3)
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        {getTelemetryIcon(key)}
                        <span className="font-medium capitalize">
                          {key.replace("_", " ")}:
                        </span>
                        <span className="ml-2">
                          {formatTelemetryValue(key, value)}
                        </span>
                      </div>
                    ))}

                  {!showAllTelemetry && additionalTelemetry.length > 3 && (
                    <div className="text-xs text-center text-neutral-500">
                      + {additionalTelemetry.length - 3} more fields
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center p-6">
            <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
            <span>No vehicle data available</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
