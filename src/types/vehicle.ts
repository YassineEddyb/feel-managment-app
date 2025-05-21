export interface VehiclePosition {
  id: string;
  name: string;
  lat: number;
  lng: number;
  heading?: number; // Direction in degrees (0-360)
}

export interface VehicleDetails {
  id: string;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  battery: number;
  timestamp: number;
  heading?: number; // Direction in degrees (0-360)
  additionalTelemetry?: Record<string, any>; // Any additional telemetry data
  // Additional fields can be added as needed
}
