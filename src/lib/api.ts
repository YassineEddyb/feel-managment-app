import { VehicleDetails, VehiclePosition } from "@/types/vehicle";
import axios from "axios";

// Flespi API token
const FLESPI_TOKEN =
  "XerK3k3u8kjS3gcwwluEcxSv7LJem1Zxn3MlB4eGd7BgENdnKzrbVTJfvx2o6m5I";

// Flespi API client
const flespiApi = axios.create({
  baseURL: "https://flespi.io",
  headers: {
    Authorization: `FlespiToken ${FLESPI_TOKEN}`,
  },
});

// Static vehicles to always include
const STATIC_VEHICLES: VehiclePosition[] = [
  //   {
  //     id: "static1",
  //     name: "Golfette_GEP 07",
  //     lat: 32.218543,
  //     lng: -7.937073,
  //     heading: 140,
  //   },
  //   {
  //     id: "static2",
  //     name: "Golfette_GEP 03",
  //     lat: 32.219243,
  //     lng: -7.935573,
  //     heading: 140,
  //   },
  //   {
  //     id: "static3",
  //     name: "Golfette_GEP 04",
  //     lat: 32.218851,
  //     lng: -7.937073,
  //     heading: 140,
  //   },
  //   {
  //     id: "static4",
  //     name: "Golfette_GEP 05",
  //     lat: 32.219851,
  //     lng: -7.937073,
  //     heading: 140,
  //   },
];

/**
 * Fetch all vehicle positions from Flespi API
 */
export const getAllVehiclesPositions = async (): Promise<VehiclePosition[]> => {
  try {
    // Get all devices
    const devicesResponse = await flespiApi.get(
      "/gw/devices/all?fields=id,name"
    );

    if (
      !devicesResponse.data?.result ||
      !Array.isArray(devicesResponse.data.result) ||
      devicesResponse.data.result.length === 0
    ) {
      // Return mock vehicles combined with static vehicles
      return [...STATIC_VEHICLES];
    }

    const devices = devicesResponse.data.result;
    const vehiclesWithPosition: VehiclePosition[] = [];

    // Process each device to get its telemetry
    for (const device of devices) {
      try {
        const telemetryResponse = await flespiApi.get(
          `/gw/devices/${device.id}/telemetry/all`
        );

        if (telemetryResponse.data?.result?.[0]?.telemetry) {
          const telemetry = telemetryResponse.data.result[0].telemetry;

          // Extract position data using the structure from the user's example
          if (
            telemetry.position?.value ||
            (telemetry["position.latitude"]?.value !== undefined &&
              telemetry["position.longitude"]?.value !== undefined)
          ) {
            // Get position data
            const lat =
              telemetry["position.latitude"]?.value ??
              telemetry.position?.value?.latitude ??
              0;

            const lng =
              telemetry["position.longitude"]?.value ??
              telemetry.position?.value?.longitude ??
              0;

            // Get heading (direction)
            const heading = telemetry["position.direction"]?.value ?? 0;

            // Only add vehicle if we have valid position data
            if (lat && lng) {
              vehiclesWithPosition.push({
                id: String(device.id),
                name:
                  device.name ||
                  telemetry["device.name"]?.value ||
                  `Vehicle ${device.id}`,
                lat: parseFloat(String(lat)),
                lng: parseFloat(String(lng)),
                heading: parseFloat(String(heading)),
              });
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching telemetry for device ${device.id}:`, err);
      }
    }

    // Combine fetched vehicles with static vehicles
    const allVehicles = [
      ...(vehiclesWithPosition.length > 0 ? vehiclesWithPosition : []),
      ...STATIC_VEHICLES,
    ];

    return allVehicles;
  } catch (error) {
    console.error("Error fetching vehicle positions:", error);
    // Return mock vehicles combined with static vehicles
    return [...STATIC_VEHICLES];
  }
};

/**
 * Get detailed vehicle information for a specific vehicle
 */
export const getVehicleDetails = async (
  vehicleId: string
): Promise<VehicleDetails> => {
  // Check if this is a static vehicle
  const staticVehicle = STATIC_VEHICLES.find((v) => v.id === vehicleId);
  if (staticVehicle) {
    return {
      id: staticVehicle.id,
      name: staticVehicle.name,
      lat: staticVehicle.lat,
      lng: staticVehicle.lng,
      speed: Math.floor(Math.random() * 25), // Random speed between 0-25 km/h
      battery: 75 + Math.floor(Math.random() * 25), // Random battery between 75-100%
      timestamp: Date.now(),
      heading: staticVehicle.heading || 0,
      additionalTelemetry: {
        altitude: 100 + Math.floor(Math.random() * 50),
        satellites: 8 + Math.floor(Math.random() * 4),
        gsm_signal: 80 + Math.floor(Math.random() * 20),
        movement: Math.random() > 0.3 ? "moving" : "stationary",
      },
    };
  }

  try {
    // Get telemetry data for the specific device
    const telemetryResponse = await flespiApi.get(
      `/gw/devices/${vehicleId}/telemetry/all`
    );

    if (telemetryResponse.data?.result?.[0]?.telemetry) {
      const telemetry = telemetryResponse.data.result[0].telemetry;

      // Get the device name
      let name = telemetry["device.name"]?.value || `Vehicle ${vehicleId}`;

      // Extract basic position data
      const lat = telemetry["position.latitude"]?.value ?? 0;
      const lng = telemetry["position.longitude"]?.value ?? 0;
      const heading = telemetry["position.direction"]?.value ?? 0;
      const speed = telemetry["position.speed"]?.value ?? 0;

      // Extract battery level
      const battery = telemetry["battery.level"]?.value ?? 0;

      // Extract timestamp
      const timestamp = telemetry.timestamp?.value
        ? telemetry.timestamp.value * 1000 // Convert to ms if in seconds
        : telemetry.server?.timestamp?.value ?? Date.now();

      // Extract additional telemetry fields
      const additionalTelemetry: Record<string, any> = {};

      // Map important telemetry fields
      const telemetryMapping = {
        "position.altitude": "altitude",
        "position.satellites": "satellites",
        "position.hdop": "hdop",
        "position.pdop": "pdop",
        "battery.voltage": "battery_voltage",
        "battery.current": "battery_current",
        "engine.ignition.status": "ignition",
        "gsm.signal.level": "gsm_signal",
        "movement.status": "movement",
        "external.powersource.voltage": "external_power",
        "sleep.mode.enum": "sleep_mode",
      };

      // Add mapped fields to additionalTelemetry
      for (const [key, mappedName] of Object.entries(telemetryMapping)) {
        if (telemetry[key]?.value !== undefined) {
          additionalTelemetry[mappedName] = telemetry[key].value;
        }
      }

      return {
        id: vehicleId,
        name,
        lat,
        lng,
        speed,
        battery,
        timestamp,
        heading,
        additionalTelemetry,
      };
    }

    // Fallback to basic position data
    const vehiclesPositions = await getAllVehiclesPositions();
    const vehiclePosition = vehiclesPositions.find((v) => v.id === vehicleId);

    if (vehiclePosition) {
      return {
        id: vehiclePosition.id,
        name: vehiclePosition.name,
        lat: vehiclePosition.lat,
        lng: vehiclePosition.lng,
        speed: 0,
        battery: 50,
        timestamp: Date.now(),
        heading: vehiclePosition.heading || 0,
        additionalTelemetry: {},
      };
    }

    // Last resort fallback
    return {
      id: vehicleId,
      name: `Vehicle ${vehicleId}`,
      lat: 32.220923,
      lng: -7.929113,
      speed: 0,
      battery: 50,
      timestamp: Date.now(),
      heading: 0,
      additionalTelemetry: {},
    };
  } catch (error) {
    console.error("Error fetching vehicle details:", error);

    // Fallback to position data
    const vehiclesPositions = await getAllVehiclesPositions();
    const vehiclePosition = vehiclesPositions.find((v) => v.id === vehicleId);

    if (vehiclePosition) {
      return {
        id: vehiclePosition.id,
        name: vehiclePosition.name,
        lat: vehiclePosition.lat,
        lng: vehiclePosition.lng,
        speed: 0,
        battery: 50,
        timestamp: Date.now(),
        heading: vehiclePosition.heading || 0,
        additionalTelemetry: {},
      };
    }

    return {
      id: vehicleId,
      name: `Vehicle ${vehicleId}`,
      lat: 32.220923,
      lng: -7.929113,
      speed: 0,
      battery: 50,
      timestamp: Date.now(),
      heading: 0,
      additionalTelemetry: {},
    };
  }
};
