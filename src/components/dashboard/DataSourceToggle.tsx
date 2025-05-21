import { Database } from "lucide-react";

/**
 * A simplified toggle component that displays the current data source
 */
export default function DataSourceToggle() {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200">
      <span className="text-sm text-gray-600 hidden md:block">
        Data Source:
      </span>

      <div className="flex items-center gap-1 px-3 py-1 rounded bg-blue-100 text-blue-700 border-blue-300 border">
        <Database className="h-4 w-4" />
        <span className="hidden md:inline">Devices</span>
      </div>
    </div>
  );
}
