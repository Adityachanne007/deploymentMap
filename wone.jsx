"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// Rest of your imports...
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGoogleMapsLoader } from "./GoogleMapsLoader";

export {};

declare global {
  namespace google.maps {
    interface Marker {
      infoWindow?: google.maps.InfoWindow;
    }
  }
}

interface Location {
  id: string;
  wo_id: string;
  step: "DONE" | "AWAITING VALIDATION" | "IN PROGRESS" | "SCHEDULED" | "UNDER PLANNING" | "NEW";
  priority: "Urgent" | "High" | "Medium" | "Low";
  asset: string;
  address: string;
  technician: string;
  latitude: number;
  longitude: number;
  Planned_Date: string | null;
  dtc: string;
  swh: string;
  point_code: string;
}

interface TechnicianLocation {
  id: string;
  name: string;
  email: string;
  latitude: number;
  longitude: number;
  locationDate: string;
}

const STEP_OPTIONS = [
  "All",
  "DONE",
  "AWAITING VALIDATION",
  "IN PROGRESS",
  "SCHEDULED",
  "UNDER PLANNING",
  "NEW",
];

const PRIORITY_OPTIONS = ["All", "Urgent", "High", "Medium", "Low", "2", "3", "4", "Absent"];

const TECHNICIAN_OPTIONS = [
  "All",
  "David Viguerard",
  "Julien Gurhem",
  "Matthieu Vassaux",
  "Alberto Vega Gonzalez",
  "Antoine Crogiez",
  "Jaime Galiano Ferrer",
  "Quentin Salat",
  "Chrys Nahayo",
  "Ali Hamid",
  "Samba TA",
  "Mohamed El Azri Ennassiri",
  "Gregory Catalan",
  "Tanguy Volta",
  "Christian Galindo",
  "Mohammed hadjadj",
  "Sabry baha",
  "Jeremias fredes",
  "Maxime Volta",
  "Alejandro Sosa",
  "Adem Mezzogh",
  "Seydou Maregadk"
].sort();

const PRIORITY_COLORS = {
  "2": "#CCCCCC",
  "3": "#888888",
  "4": "#444444",
  "Absent": "#8B008B",
  "Urgent": "#D10000",
  "High": "#FF2B2B",
  "Medium": "#FFA500",
  "Low": "#008F44",
};

const STEP_COLORS = {
  DONE: "#4caf50",
  "AWAITING VALIDATION": "#ff9800",
  "IN PROGRESS": "#2196f3",
  SCHEDULED: "#9c27b0",
  "UNDER PLANNING": "#795548",
  NEW: "#607d8b",
};

const DEFAULT_CENTER = { lat: 46.2276, lng: 2.2137 };
const DEFAULT_ZOOM = 6;

const getMarkerScale = (step: string): number => {
  switch (step) {
    case 'DONE':
      return 10;
    case 'SCHEDULED':
      return 3;
    case 'AWAITING VALIDATION':
      return 3;
    case 'IN PROGRESS':
      return 2;
    case 'UNDER PLANNING':
      return 3;
    case 'NEW':
      return 3;
    default:
      return 8;
  }
};

const fitMapToBounds = (markers: google.maps.Marker[], mapInstance: google.maps.Map) => {
  if (markers.length > 0) {
    const bounds = new google.maps.LatLngBounds();
    markers.forEach((marker) => {
      const position = marker.getPosition();
      if (position) {
        bounds.extend(position);
      }
    });
    mapInstance.fitBounds(bounds);
  }
};

const getRelevantDays = () => {
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const relevantDays = [
    { label: "All", value: "All" },
    { label: "N/A", value: "na" },
    { label: "Not Today", value: "not_today" },
  ];

  for (let i = 0; i <= 6; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    if (date.getDay() === 0) continue; // Skip Sundays

    const label =
      date.toDateString() === today.toDateString()
        ? "Today"
        : `${daysOfWeek[date.getDay()]}, ${date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })}`;

    relevantDays.push({
      label,
      value: date.toLocaleDateString(),
    });
  }

  return relevantDays;
};

const WEEK_DAYS_OPTIONS = getRelevantDays();

interface MultiSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: Array<{ label: string; value: string; } | string>;
  label: string;
  colorMap?: Record<string, string>;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  value,
  onValueChange,
  options,
  label,
  colorMap = {},
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formatOption = (opt: string | { label: string; value: string }) => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt };
    }
    return opt;
  };

  const formattedOptions = options.map(formatOption);

  const toggleOption = (optionValue: string) => {
    if (optionValue === "All") {
      onValueChange([]);
      return;
    }

    if (value.includes(optionValue)) {
      const newValue = value.filter((v) => v !== optionValue);
      onValueChange(newValue.length === 0 ? [] : newValue);
    } else {
      onValueChange([...value, optionValue]);
    }
  };

  const getDisplayValue = () => {
    if (value.length === 0) return "All";
    if (value.length === 1) return formattedOptions.find((opt) => opt.value === value[0])?.label;
    return `${value.length} selected`;
  };

  return (
    <div className="w-48">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <div
          className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          {getDisplayValue()}
        </div>
        {isDropdownOpen && (
          <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg">
            {/* Scrollable Options */}
            <div className="max-h-[300px] overflow-y-auto">
              {formattedOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleOption(option.value)}
                >
                  <input
                    type="checkbox"
                    checked={
                      option.value === "All"
                        ? value.length === 0
                        : value.includes(option.value)
                    }
                    readOnly
                    className="h-4 w-4 rounded border-gray-300 mr-2"
                  />
                  {colorMap && colorMap[option.value] && (
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{
                        backgroundColor:
                          option.value !== "All" ? colorMap[option.value] : "transparent",
                      }}
                    />
                  )}
                  {option.label}
                </div>
              ))}
            </div>
            {/* Fixed Apply Button */}
            <div className="p-2 border-t border-gray-200">
              <button
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
                onClick={() => setIsDropdownOpen(false)}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



interface FilterCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}

const FilterCheckbox: React.FC<FilterCheckboxProps> = ({ checked, indeterminate, onChange, label }) => {
  const checkboxRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="form-checkbox h-4 w-4 text-blue-600"
    />
  );
};

interface FilterSelectProps {
  value: string[];
  label: string;
  options: Array<{ value: string; label: string }>;
  onValueChange: (value: string[]) => void;
}

interface SelectItemProps {
  option: { value: string; label: string };
  value: string[];
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  label,
  options,
  onValueChange,
}) => {
  const formattedOptions = [
    { value: "All", label: "All" },
    ...options
  ];

  const isSelected = (optionValue: string) => {
    if (optionValue === "All") {
      return value.length === 0;
    }
    return value.includes(optionValue);
  };

  const toggleOption = (optionValue: string) => {
    if (optionValue === "All") {
      onValueChange([]);
      return;
    }

    const newValue = value.includes(optionValue)
      ? []  // Reset to "All" when deselecting the last item
      : [optionValue];  // Single selection mode
    onValueChange(newValue);
  };

  return (
    <div className="w-48">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <Select
        value={value.length === 0 ? "All" : value[0]}
        onValueChange={toggleOption}
      >
        <SelectTrigger>
          <SelectValue placeholder={value.length === 0 ? "All" : formattedOptions.find(opt => opt.value === value[0])?.label} />
        </SelectTrigger>
        <SelectContent>
          {formattedOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="relative flex items-center px-2 py-2 cursor-pointer"
            >
              <div 
                className={`
                  w-4 h-4 
                  border rounded 
                  mr-2
                  ${isSelected(option.value) ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}
                `}
              >
                {isSelected(option.value) && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// First, add a custom checkbox component
const CustomCheckbox = ({ checked }: { checked: boolean }) => (
  <div className={`
    w-4 h-4 mr-2 rounded border
    ${checked 
      ? 'bg-blue-500 border-blue-500' 
      : 'bg-white border-gray-300'
    }
  `}>
    {checked && (
      <svg 
        className="w-4 h-4 text-white" 
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 13l4 4L19 7"
        />
      </svg>
    )}
  </div>
);

export default function AirtableMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);
  const [recordsWithoutCoordinates, setRecordsWithoutCoordinates] = useState<Location[]>([]);
  const [technicianLocations, setTechnicianLocations] = useState<TechnicianLocation[]>([]);
  const [showTechnicians, setShowTechnicians] = useState<boolean>(false);
  const isGoogleMapsLoaded = useGoogleMapsLoader();
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const [showNotSelected, setShowNotSelected] = useState<boolean>(false);

  const resetFilters = () => {
    setSelectedSteps([]);
    setSelectedPriorities([]);
    setSelectedTechnicians([]);
    setSelectedDays([]);
    setFilteredLocations(locations);
  };

  const refreshData = () => {
    if (map) {
      fetchData(map);
    }
  };

  

  const fetchData = async (mapInstance: google.maps.Map) => {
    try {
      console.log("Fetching data...");
      const response = await fetch("/api/airtable");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
  
      // Process work orders
      const allRecords = data.workOrders.map((record: { id: string; fields: Record<string, any> }): Location => {
        const technicianName = Array.isArray(record.fields["Technician Name"])
          ? record.fields["Technician Name"][0]
          : record.fields["Technician Name"] || "Unassigned";
  
        const plannedDate =
          record.fields["Planned Date"] &&
          !isNaN(Date.parse(record.fields["Planned Date"]))
            ? new Date(record.fields["Planned Date"]).toISOString()
            : null;
  
        return {
          id: record.id,
          wo_id: record.fields.WO_ID,
          step: record.fields.Step,
          priority: record.fields.Priority,
          asset: record.fields["Import ID"] || "N/A",
          address: record.fields.Address || "N/A",
          technician: technicianName,
          Planned_Date: plannedDate,
          latitude: parseFloat(record.fields.Latitude),
          longitude: parseFloat(record.fields.Longitude),
          dtc: !isNaN(record.fields["Days to complete"]) && record.fields["Days to complete"] !== "" 
            ? record.fields["Days to complete"] 
            : "N/A",
          swh: record.fields["Store Working hours"] || "N/A",
          point_code: record.fields["Point Code"] || "N/A",
        };
      });
  
      // Process technicians
      const techLocations = data.technicians.map((record: any): TechnicianLocation => ({
        id: record.id,
        name: record.fields.Name,
        email: record.fields.Email,
        latitude: parseFloat(record.fields.Latitude),
        longitude: parseFloat(record.fields.Longitude),
        locationDate: record.fields["Location date"],
      })).filter((tech: TechnicianLocation) => {
        const isValidLat = !isNaN(tech.latitude) && tech.latitude >= -90 && tech.latitude <= 90;
        const isValidLng = !isNaN(tech.longitude) && tech.longitude >= -180 && tech.longitude <= 180;
        return isValidLat && isValidLng;
      });
  
      // Process work order records
      const validRecords = allRecords.filter((record: Location) => {
        const isValidLat = !isNaN(record.latitude) && record.latitude >= -90 && record.latitude <= 90;
        const isValidLng = !isNaN(record.longitude) && record.longitude >= -180 && record.longitude <= 180;
        return isValidLat && isValidLng;
      });
  
      const invalidRecords = allRecords.filter((record: Location) => {
        const isValidLat = !isNaN(record.latitude) && record.latitude >= -90 && record.latitude <= 90;
        const isValidLng = !isNaN(record.longitude) && record.longitude >= -180 && record.longitude <= 180;
        return !isValidLat || !isValidLng;
      });
  
      // Update all states
      setTechnicianLocations(techLocations);
      setRecordsWithoutCoordinates(invalidRecords);
      setLocations(validRecords);
      setFilteredLocations(validRecords);
      updateMarkers(validRecords, mapInstance);
  
      if (isAutoFit) {
        fitMapToBounds(markers, mapInstance);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setTechnicianLocations([]);
      setRecordsWithoutCoordinates([]);
      setLocations([]);
      setFilteredLocations([]);
    }
  };

  const getLocationMatches = (location: Location) => {
    const stepsMatch = selectedSteps.length === 0 || selectedSteps.includes(location.step);
    const prioritiesMatch = selectedPriorities.length === 0 || selectedPriorities.includes(location.priority);
    const techniciansMatch = selectedTechnicians.length === 0 || selectedTechnicians.includes(location.technician);
    
    let daysMatch = true;
    if (selectedDays.length > 0) {
      daysMatch = false;
      for (const selectedDay of selectedDays) {
        if (selectedDay === "all") {
          daysMatch = true;
          break;
        }
        if (selectedDay === "na" && location.Planned_Date === null) {
          daysMatch = true;
          break;
        }
        if (selectedDay === "not_today") {
          const today = new Date().toLocaleDateString();
          if (!location.Planned_Date || new Date(location.Planned_Date).toLocaleDateString() !== today) {
            daysMatch = true;
            break;
          }
        }
        if (location.Planned_Date && new Date(location.Planned_Date).toLocaleDateString() === selectedDay) {
          daysMatch = true;
          break;
        }
      }
    }

    return stepsMatch && prioritiesMatch && techniciansMatch && daysMatch;
  };

  const updateMarkers = (data: Location[], mapInstance: google.maps.Map) => {
    markers.forEach((marker) => marker.setMap(null));
  
    const allMarkers: google.maps.Marker[] = [];

    const STEP_SHAPES = {
      DONE: google.maps.SymbolPath.CIRCLE,
      "AWAITING VALIDATION": "M -3,-4.5 L 3,-4.5 C 2.25,-3 0.75,-1.5 0,0 C 0.75,1.5 2.25,3 3,4.5 L -3,4.5 C -2.25,3 -0.75,1.5 0,0 C -0.75,-1.5 -2.25,-3 -3,-4.5",
      "IN PROGRESS": "M 0,-6 L 1.8,-1.8 L 6,-1.8 L 3,1.2 L 4.2,6 L 0,3 L -4.2,6 L -3,1.2 L -6,-1.8 L -1.8,-1.8 Z",
      SCHEDULED: "M 0,-4 L 4,0 L 0,4 L -4,0 Z",
      "UNDER PLANNING": "M 0,-4 4,4 -4,4 Z",
      NEW: "M 0,-4.5 L 4,-1.5 L 2.5,4 L -2.5,4 L -4,-1.5 Z",
    };

    const locationsToShow = showNotSelected ? data : data.filter(getLocationMatches);
    
    locationsToShow.forEach((location) => {
      const isSelected = getLocationMatches(location);
      const opacity = (showNotSelected && !isSelected) ? 0.6 : 0.9;
      const scale = (showNotSelected && !isSelected) ? 
        getMarkerScale(location.step) * 0.7 : 
        getMarkerScale(location.step);

      const formattedDate = location.Planned_Date
        ? new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }).format(new Date(location.Planned_Date))
        : "N/A";

      const marker = new google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: mapInstance,
        icon: {
          path: STEP_SHAPES[location.step as keyof typeof STEP_SHAPES],
          fillColor: PRIORITY_COLORS[location.priority as keyof typeof PRIORITY_COLORS],
          fillOpacity: opacity,
          strokeWeight: 1,
          strokeColor: "#FFFFFF",
          scale: scale,
          strokeOpacity: opacity,
        },
        label: showLabels
          ? {
              text: String(location.wo_id),
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: "bold",
              className: "custom-label",
            }
          : undefined,
      });

      // Create and attach tooltip
      const tooltip = document.createElement("div");
      tooltip.style.position = "absolute";
      tooltip.style.background = "#333";
      tooltip.style.color = "#fff";
      tooltip.style.padding = "5px 10px";
      tooltip.style.borderRadius = "5px";
      tooltip.style.fontSize = "12px";
      tooltip.style.visibility = "hidden";
      tooltip.style.zIndex = "1000";
      tooltip.innerHTML = `
        <div style="
          font-family: Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          background-color: #ffffff;
          color: #000000;
          border: 2px solid #333;
          border-radius: 8px;
          padding: 10px;
          box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
          max-width: 280px;
          opacity: ${isSelected ? 0.95 : 0.8};">
          <p style="margin: 0 0 8px; font-weight: bold;">WO ID: <span style="font-weight: normal;">${location.wo_id}</span></p>
          <p style="margin: 0 0 8px; font-weight: bold;">Step: <span style="font-weight: normal;">${location.step}</span></p>
          <p style="margin: 0 0 8px; font-weight: bold;">Point code: <span style="font-weight: normal;">${location.point_code}</span></p>
          <p style="margin: 0 0 8px; font-weight: bold;">
            Intervention Deadline: 
            <span style="font-weight: normal; color: ${Number(location.dtc) < 0 ? '#d10000' : '#333'};">
              ${location.dtc} Days
            </span>
          </p>
          <p style="margin: 0 0 8px; font-weight: bold;">Technician: <span style="font-weight: normal;">${location.technician}</span></p>
          <p style="margin: 0 0 8px; font-weight: bold;">Planned Date: <span style="font-weight: normal;">${formattedDate}</span></p>
          <p style="margin: 0; font-weight: bold;">Store Opening Hours: <span style="font-weight: normal;">${location.swh}</span></p>
        </div>
      `;

      document.body.appendChild(tooltip);

      marker.addListener("mouseover", (event: google.maps.MapMouseEvent) => {
        if (!showLabels && event.domEvent instanceof MouseEvent) {
          tooltip.style.visibility = "visible";
          tooltip.style.left = `${event.domEvent.clientX + 10}px`;
          tooltip.style.top = `${event.domEvent.clientY + 10}px`;
        }
      });

      marker.addListener("mousemove", (event: google.maps.MapMouseEvent) => {
        if (!showLabels && event.domEvent instanceof MouseEvent) {
          tooltip.style.left = `${event.domEvent.clientX + 10}px`;
          tooltip.style.top = `${event.domEvent.clientY + 10}px`;
        }
      });

      marker.addListener("mouseout", () => {
        tooltip.style.visibility = "hidden";
      });

      marker.addListener("remove", () => {
        tooltip.remove();
      });

      

      

      

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="
            font-family: Arial, sans-serif; 
            font-size: 14px; 
            line-height: 1.8; 
            color: #333; 
            max-width: 320px; 
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
            opacity: ${opacity};">
            <h3 style="
              margin: 0 0 10px; 
              font-size: 18px; 
              font-weight: bold; 
              color: #333; 
              border-bottom: 1px solid #ddd; 
              padding-bottom: 5px;">
              Work Order ID: <span style="color:#2196F3; cursor:pointer;">${location.wo_id}</span>
            </h3>
            <p style="margin: 6px 0;"><strong style="color:#555;">Asset:</strong> <span style="margin-left: 5px; color: #000;">${location.asset}</span></p>
            <p style="margin: 6px 0;"><strong style="color:#555;">Step:</strong> <span style="margin-left: 5px; color: #000;">${location.step}</span></p>
            <p style="margin: 6px 0;"><strong style="color:#555;">Address:</strong> <span style="margin-left: 5px; color: #000;">${location.address}</span></p>
            <p style="margin: 6px 0;"><strong style="color:#555;">Point Code:</strong> <span style="margin-left: 5px; color: #000;">${location.point_code}</span></p>
            <p style="margin: 6px 0;">
              <strong style="color:#555;">Priority:</strong> 
              <span style="
                margin-left: 5px;
                color: ${PRIORITY_COLORS[location.priority as keyof typeof PRIORITY_COLORS]};
                font-weight: bold;">${location.priority}</span>
            </p>
            <p style="margin: 6px 0;"><strong style="color:#555;">Technician:</strong> <span style="margin-left: 5px; color: #000;">${location.technician}</span></p>
            <p style="margin: 6px 0;"><strong style="color:#555;">Planned Date:</strong> <span style="margin-left: 5px; color: #000;">${formattedDate}</span></p>
            <p style="margin: 6px 0;"><strong style="color:#555;">Intervention Deadline:</strong> <span style="font-weight: normal; color: ${Number(location.dtc) < 0 ? '#d10000' : '#333'};">
              ${location.dtc} Days
            </span></p>
            <p style="margin: 6px 0;"><strong style="color:#555;">Store Working Hours:</strong> <span style="margin-left: 5px; color: #000;">${location.swh}</span></p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        allMarkers.forEach((m) => m.infoWindow?.close());
        infoWindow.open(mapInstance, marker);
      });

      marker.infoWindow = infoWindow;
      allMarkers.push(marker);
      return marker;
    });

    // Add technician markers if enabled
    if (showTechnicians) {
      technicianLocations.forEach((tech) => {
        const marker = new google.maps.Marker({
          position: { lat: tech.latitude, lng: tech.longitude },
          map: mapInstance,
          icon: {
            path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
            fillColor: "#000",
            fillOpacity: 0.9,
            strokeWeight: 1,
            strokeColor: "#FFFFFF",
            scale: 1.5,
            anchor: new google.maps.Point(12, 12),
          },
          title: tech.name,
        });
    
        // Create and attach tooltip
        const tooltip = document.createElement("div");
        tooltip.style.position = "absolute";
        tooltip.style.background = "#333";
        tooltip.style.color = "#fff";
        tooltip.style.padding = "5px 10px";
        tooltip.style.borderRadius = "5px";
        tooltip.style.fontSize = "12px";
        tooltip.style.visibility = "hidden";
        tooltip.style.zIndex = "1000";
        tooltip.innerHTML = `
          <div style="
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            background-color: #ffffff;
            color: #000000;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
            max-width: 280px;
            opacity: 0.95;">
            <p style="margin: 0 0 8px; font-weight: bold;">Technician: <span style="font-weight: normal;">${tech.name}</span></p>
            <p style="margin: 0 0 8px; font-weight: bold;">Email: <span style="font-weight: normal;">${tech.email}</span></p>
            <p style="margin: 0 0 8px; font-weight: bold;">Last Update: <span style="font-weight: normal;">${new Date(tech.locationDate).toLocaleString()}</span></p>
          </div>
        `;
    
        document.body.appendChild(tooltip);
    
        marker.addListener("mouseover", (event: google.maps.MapMouseEvent) => {
          if (!showLabels && event.domEvent instanceof MouseEvent) {
            tooltip.style.visibility = "visible";
            tooltip.style.left = `${event.domEvent.clientX + 10}px`;
            tooltip.style.top = `${event.domEvent.clientY + 10}px`;
          }
        });
    
        marker.addListener("mousemove", (event: google.maps.MapMouseEvent) => {
          if (!showLabels && event.domEvent instanceof MouseEvent) {
            tooltip.style.left = `${event.domEvent.clientX + 10}px`;
            tooltip.style.top = `${event.domEvent.clientY + 10}px`;
          }
        });
    
        marker.addListener("mouseout", () => {
          tooltip.style.visibility = "hidden";
        });
    
        marker.addListener("remove", () => {
          tooltip.remove();
        });
    

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="
              font-family: Arial, sans-serif; 
              font-size: 14px; 
              line-height: 1.8; 
              color: #333; 
              max-width: 320px; 
              border-radius: 8px;
              padding: 10px;
              box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);">
              <h3 style="
                margin: 0 0 10px; 
                font-size: 18px; 
                font-weight: bold; 
                color: #333; 
                border-bottom: 1px solid #ddd; 
                padding-bottom: 5px;">
                Technician: <span style="color:#2196F3; cursor:pointer;">${tech.name}</span>
              </h3>
              <p style="margin: 6px 0;">
                <strong style="color:#555;">Email:</strong> 
                <span style="margin-left: 5px; color: #000;">${tech.email}</span>
              </p>
              <p style="margin: 6px 0;">
                <strong style="color:#555;">Last Updated:</strong> 
                <span style="margin-left: 5px; color: #000;">${new Date(tech.locationDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true
                })}</span>
              </p>
            </div>
          `
        });

        marker.addListener("click", () => {
          allMarkers.forEach((m) => m.infoWindow?.close());
          infoWindow.open(mapInstance, marker);
        });

        marker.infoWindow = infoWindow;
        allMarkers.push(marker);
        return marker;
      });
    }

    setMarkers(allMarkers);
    setFilteredLocations(data.filter(getLocationMatches));

    if (isAutoFit) {
      fitMapToBounds(allMarkers, mapInstance);
    }
  };

  

  // Component Lifecycle Hooks
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || map) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      gestureHandling: "greedy"
    });

    setMap(mapInstance);
  }, [isGoogleMapsLoaded]);

  useEffect(() => {
    if (map) {
      fetchData(map);
    }
  }, [map]);

  useEffect(() => {
    if (map) {
      updateMarkers(locations, map);
    }
  }, [selectedSteps, selectedPriorities, selectedTechnicians, selectedDays, 
      showLabels, showNotSelected, showTechnicians, locations, technicianLocations, map]);

  // Loading State
  if (!isGoogleMapsLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Work Orders Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[600px]">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="text-gray-600">Loading Google Maps...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
// Main Component Render
return (
  <Card className="bg-white">
    <CardHeader>
      <CardTitle>Work Orders and Technicians Map</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Filters Section */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <MultiSelect
          value={selectedSteps}
          onValueChange={setSelectedSteps}
          options={STEP_OPTIONS}
          label="Steps"
          colorMap={STEP_COLORS}
        />

        <MultiSelect
          value={selectedPriorities}
          onValueChange={setSelectedPriorities}
          options={PRIORITY_OPTIONS}
          label="Priorities"
          colorMap={PRIORITY_COLORS}
        />

        <MultiSelect
          value={selectedTechnicians}
          onValueChange={setSelectedTechnicians}
          options={TECHNICIAN_OPTIONS}
          label="Technicians"
        />

        <MultiSelect
          value={selectedDays}
          onValueChange={setSelectedDays}
          options={WEEK_DAYS_OPTIONS}
          label="Days"
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-white bg-blue-500 rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            Reset Filters
          </button>

          <button
            onClick={refreshData}
            className="px-4 py-2 text-white bg-purple-500 rounded-md shadow-sm hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 flex items-center gap-2"
          >
            <span>Refresh Data</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
            </svg>
          </button>

          <button
            onClick={() => {
              setIsAutoFit(!isAutoFit);
              if (!isAutoFit && map) {
                fitMapToBounds(markers, map);
              }
            }}
            className={`px-4 py-2 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center gap-2
              ${isAutoFit 
                ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500' 
                : 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
              }`}
          >
            {isAutoFit ? (
              <>
                <span>Free View</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </>
            ) : (
              <>
                <span>Locked view</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6"/>
                  <path d="M9 21H3v-6"/>
                  <path d="M21 3l-7 7"/>
                  <path d="M3 21l7-7"/>
                </svg>
              </>
            )}
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-4 py-2 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center gap-2 ${
              showLabels
                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
                : 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
            }`}
          >
            {showLabels ? 'Hide Labels' : 'Show Labels'}
          </button>

          <button
            onClick={() => setShowNotSelected(!showNotSelected)}
            className={`px-4 py-2 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center gap-2 ${
              showNotSelected
                ? 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-500'
                : 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500'
            }`}
          >
            <span>{showNotSelected ? 'Hide Unselected' : 'Show Unselected'}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>

          <button
            onClick={() => setShowTechnicians(!showTechnicians)}
            className={`px-4 py-2 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center gap-2 ${
              showTechnicians
                ? 'bg-green-500 hover:bg-green-600 focus:ring-green-500'
                : 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500'
            }`}
          >
            <span>{showTechnicians ? 'Hide Technicians' : 'Show Technicians'}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </div>

{/* Map Container */}
<div
        ref={mapRef}
        id="map"
        className="w-full h-[600px] rounded-lg border border-gray-200"
      />

      {/* Tables Section */}
      <div className="mt-6 space-y-6">

          {/* Work Orders Without Coordinates Table */}
          {recordsWithoutCoordinates.length > 0 && (
          <div className="rounded-lg border border-gray-200">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Work Orders Missing Coordinates ({recordsWithoutCoordinates.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WO ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Step
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Technician
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Planned Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recordsWithoutCoordinates.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {record.wo_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span 
                          className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{ 
                            backgroundColor: `${STEP_COLORS[record.step as keyof typeof STEP_COLORS]}20`,
                            color: STEP_COLORS[record.step as keyof typeof STEP_COLORS] 
                          }}
                        >
                          {record.step}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span 
                          className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{ 
                            backgroundColor: `${PRIORITY_COLORS[record.priority as keyof typeof PRIORITY_COLORS]}20`,
                            color: PRIORITY_COLORS[record.priority as keyof typeof PRIORITY_COLORS]
                          }}
                        >
                          {record.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.technician}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {record.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.Planned_Date ? 
                          (() => {
                            try {
                              return new Date(record.Planned_Date).toLocaleDateString("en-US", {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                timeZone: 'UTC'
                              });
                            } catch {
                              return 'Invalid Date';
                            }
                          })()
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Technician Locations Table */}
        {showTechnicians && (
          <div className="rounded-lg border border-gray-200">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Technician Locations ({technicianLocations.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Update
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {technicianLocations.map((tech) => (
                    <tr key={tech.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tech.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tech.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {`${tech.latitude.toFixed(6)}, ${tech.longitude.toFixed(6)}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tech.locationDate).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      

        {/* Summary Text */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredLocations.length} of {locations.length} work orders on map
        </div>
      </div>
    </CardContent>
  </Card>
);
}