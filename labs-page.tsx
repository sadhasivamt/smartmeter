import { useState } from "react";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { LogOut, FlaskConical, Loader2, Signal, SignalHigh, SignalLow, SignalZero } from "lucide-react";
import { toast } from "sonner";
import { NavigationPane } from "./navigation-pane";
import { cn } from "../lib/utils";

interface LabsPageProps {
  onLogout: () => void;
  userName: string;
  onSelectSet: (labId: string, labNumber: number, setNumber: number, manufacture: string) => void;
  onNavigateToDashboard: () => void;
  isDemoMode?: boolean;
}

// Type definitions for API responses
interface Lab {
  lab_id: string;
  lab_name: string;
  number: number;
}

interface Manufacture {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  name: string;
}

// Signal strength types
type SignalStrength = "full" | "medium" | "none";

interface Set {
  id: string;
  name: string;
  number: number;
  manufacture: string;
  variant: string;
  signalStrength: SignalStrength; // Green = full, Yellow = medium, Red = none
}

interface LabDetailsResponse {
  manufactures: Manufacture[];
  variants: Variant[];
  sets: Set[];
}

export function LabsPage({ onLogout, userName, onSelectSet, onNavigateToDashboard, isDemoMode }: LabsPageProps) {
  const [selectedLab, setSelectedLab] = useState<string>("");
  const [selectedManufacture, setSelectedManufacture] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [selectedSet, setSelectedSet] = useState<number | null>(null);
  
  // Dynamic data from API
  const [labs, setLabs] = useState<Lab[]>([]);
  const [chManufactures, setChManufactures] = useState<Manufacture[]>([]);
  const [chVariants, setChVariants] = useState<Variant[]>([]);
  const [allSets, setAllSets] = useState<Set[]>([]);
  
  // Loading states
  const [isLoadingLabs, setIsLoadingLabs] = useState(true);
  const [isLoadingLabDetails, setIsLoadingLabDetails] = useState(false);

  // API Configuration
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const API_BASE_URL = configuredBaseUrl || "https://your-api-endpoint.com"; // Replace with your actual API URL
  const LABS_ENDPOINT = `${API_BASE_URL}/device-inventory/get_lab_inventory`;
  const LAB_DETAILS_ENDPOINT = `${API_BASE_URL}/api/labs`;

  // Get authentication token from storage
  const getAuthToken = (): string | null => {
    return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  };

  /**
   * Fetch list of labs when component mounts
   */
  useEffect(() => {
    fetchLabs();
  }, []);

  /**
   * Fetch labs from API
   */
  const fetchLabs = async () => {
    setIsLoadingLabs(true);
    
    // If in demo mode, use mock data
    if (isDemoMode) {
      setTimeout(() => {
        const mockLabs = Array.from({ length: 50 }, (_, i) => ({
          lab_id: `lab-${i + 1}`,
          lab_name: `Lab ${i + 1}`,
          number: i + 1,
        }));
        setLabs(mockLabs);
        setIsLoadingLabs(false);
        toast.success("Labs loaded successfully (Demo Mode)");
      }, 500);
      return;
    }
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        setIsLoadingLabs(false);
        return;
      }

      const response = await fetch(LABS_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      // Check if response is JSON by checking content-type header
      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      // Handle specific error codes
      if (response.status === 401) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.detail || "Unauthorized - Please login again");
        }
        throw new Error("Invalid or missing token");
      }

      if (response.status === 404) {
        throw new Error("Labs endpoint not found. Please check your API configuration.");
      }

      if (response.status >= 500 || response.status === 400) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.detail || errorData.message || "API error occurred");
        }
        throw new Error("Server error occurred. Please try again later.");
      }

      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.detail || "Failed to fetch labs");
        }
        throw new Error(`Failed to fetch labs (Status: ${response.status})`);
      }

      // Only try to parse JSON if content-type is JSON
      if (!isJson) {
        throw new Error("Invalid response from server. Expected JSON but received HTML.");
      }

      const data = await response.json();
      
      // Expected JSON format:
      // [
      //   { "lab_id": "andromada", "lab_name": "andromada" },
      //   { "lab_id": "andromada12", "lab_name": "andromada12" },
      //   ...
      // ]
      
      // Map the response to include a number field
      const mappedLabs = data.map((lab: { lab_id: string; lab_name: string }, index: number) => ({
        lab_id: lab.lab_id,
        lab_name: lab.lab_name,
        number: index + 1,
      }));

      setLabs(mappedLabs);
      toast.success("Labs loaded successfully");
    } catch (error) {
      console.error("Error fetching labs:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load labs";
      toast.error(errorMessage);
      setLabs([]);
    } finally {
      setIsLoadingLabs(false);
    }
  };

  /**
   * Fetch lab details (manufactures, variants, sets) when lab is selected
   */
  const fetchLabDetails = async (labId: string, labNumber: number) => {
    setIsLoadingLabDetails(true);

    // MOCK API CALL - Remove this and uncomment real API call below
    setTimeout(() => {
      // Mock data
      const mockManufactures = [
        { id: "toshiba-4g", name: "Toshiba 4G" },
        { id: "vmo2", name: "VMO2" },
        { id: "edmi", name: "EDMI" },
        { id: "wnc", name: "WNC" },
      ];

      const mockVariants = [
        { id: "sbch", name: "SBCH" },
        { id: "dbch", name: "DBCH" },
        { id: "flch", name: "FLCH" },
        { id: "witch", name: "WITCH" },
      ];

      // Mock sets with manufacture and variant assignments
      const mockSets = Array.from({ length: 50 }, (_, i) => ({
        id: `set-${i + 1}`,
        name: `Set ${i + 1}`,
        number: i + 1,
        manufacture: mockManufactures[Math.floor(i / 13) % 4].id,
        variant: mockVariants[Math.floor(i / 13) % 4].id,
        signalStrength: i % 3 === 0 ? "full" : i % 3 === 1 ? "medium" : "none",
      }));

      setChManufactures(mockManufactures);
      setChVariants(mockVariants);
      setAllSets(mockSets);
      setIsLoadingLabDetails(false);
      toast.success(`Lab ${labNumber} details loaded`);
    }, 800);

    /* REAL API CALL - Uncomment when connecting to actual backend
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${LAB_DETAILS_ENDPOINT}/${labId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch lab details");
      }

      const data: LabDetailsResponse = await response.json();
      
      // Expected JSON format:
      // {
      //   "manufactures": [
      //     { "id": "toshiba-4g", "name": "Toshiba 4G" },
      //     { "id": "vmo2", "name": "VMO2" },
      //     ...
      //   ],
      //   "variants": [
      //     { "id": "sbch", "name": "SBCH" },
      //     { "id": "dbch", "name": "DBCH" },
      //     ...
      //   ],
      //   "sets": [
      //     { "id": "set-1", "name": "Set 1", "number": 1, "manufacture": "toshiba-4g", "variant": "sbch" },
      //     { "id": "set-2", "name": "Set 2", "number": 2, "manufacture": "vmo2", "variant": "dbch" },
      //     ...
      //   ]
      // }
      
      setChManufactures(data.manufactures || []);
      setChVariants(data.variants || []);
      setAllSets(data.sets || []);
      toast.success(`Lab ${labNumber} details loaded`);
    } catch (error) {
      console.error("Error fetching lab details:", error);
      toast.error("Failed to load lab details. Please try again.");
      setChManufactures([]);
      setChVariants([]);
      setAllSets([]);
    } finally {
      setIsLoadingLabDetails(false);
    }
    */
  };

  // Filter sets based on selections
  const getFilteredSets = () => {
    let filtered = allSets;

    // Filter by manufacture if selected
    if (selectedManufacture) {
      filtered = filtered.filter(set => set.manufacture === selectedManufacture);
    }

    // Filter by variant if selected
    if (selectedVariant) {
      filtered = filtered.filter(set => set.variant === selectedVariant);
    }

    return filtered;
  };

  const sets = getFilteredSets();

  const handleLabChange = (value: string) => {
    setSelectedLab(value);
    setSelectedManufacture(""); // Reset manufacture when lab changes
    setSelectedVariant(""); // Reset variant when lab changes
    setSelectedSet(null); // Reset set selection when lab changes
    const lab = labs.find((l) => l.lab_id === value);
    if (lab) {
      fetchLabDetails(value, lab.number);
    }
  };

  const handleManufactureChange = (value: string) => {
    setSelectedManufacture(value);
    setSelectedVariant(""); // Reset variant when manufacture changes
    setSelectedSet(null); // Reset set selection when manufacture changes
  };

  const handleVariantChange = (value: string) => {
    setSelectedVariant(value);
    setSelectedSet(null); // Reset set selection when variant changes
  };

  const handleSetClick = (setNumber: number) => {
    setSelectedSet(setNumber);
  };

  const handleOpenSet = () => {
    const lab = labs.find((l) => l.lab_id === selectedLab);
    const set = sets.find((s) => s.number === selectedSet);
    if (lab && set) {
      onSelectSet(lab.lab_id, lab.number, set.number, set.manufacture);
    }
  };

  const handleNavigate = (page: "dashboard" | "labs") => {
    if (page === "dashboard") {
      onNavigateToDashboard();
    }
    // Labs is already the current page, no action needed
  };

  return (
    <>
      {/* Navigation Pane */}
      <NavigationPane
        currentPage="labs"
        userName={userName}
        onNavigate={handleNavigate}
        onLogout={onLogout}
      />

      {/* Main Content with margin for navigation */}
      <div className="ml-[156px] transition-all duration-300">
        <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          {/* Common Header */}
          <div className="fixed top-0 left-[156px] right-4 bg-white shadow-md z-10 py-3 rounded-br-lg">
            <div className="max-w-7xl mx-auto px-4">
              <h1 className="font-semibold text-center">Automated Logging Solution</h1>
              <p className="text-sm text-gray-600 text-center">Smart Lab selection</p>
            </div>
          </div>

          {/* User Info and Logout */}
          <div className="max-w-4xl mx-auto mb-6 mt-20">
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3">
                <FlaskConical className="size-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Welcome, {userName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Select Laboratory and Set</CardTitle>
                <CardDescription>
                  Choose from 50 available labs and their corresponding sets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lab Selection */}
                <div className="space-y-2">
                  <Label htmlFor="lab-select">Laboratory</Label>
                  <Select value={selectedLab} onValueChange={handleLabChange} disabled={isLoadingLabs}>
                    <SelectTrigger id="lab-select">
                      {isLoadingLabs ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          <span>Loading labs...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Select a lab (1-50)" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {labs.map((lab) => (
                        <SelectItem key={lab.lab_id} value={lab.lab_id}>
                          {lab.lab_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Manufacture Selection - Only show when lab is selected */}
                {selectedLab && (
                  <div className="space-y-2">
                    <Label htmlFor="manufacture-select">Manufacture</Label>
                    <Select value={selectedManufacture} onValueChange={handleManufactureChange} disabled={isLoadingLabDetails}>
                      <SelectTrigger id="manufacture-select">
                        {isLoadingLabDetails ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            <span>Loading manufactures...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select a manufacture" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {chManufactures.map((manufacture) => (
                          <SelectItem key={manufacture.id} value={manufacture.id}>
                            {manufacture.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Variant Selection - Only show when manufacture is selected */}
                {selectedManufacture && (
                  <div className="space-y-2">
                    <Label htmlFor="variant-select">Variant</Label>
                    <Select value={selectedVariant} onValueChange={handleVariantChange} disabled={isLoadingLabDetails}>
                      <SelectTrigger id="variant-select">
                        {isLoadingLabDetails ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            <span>Loading variants...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select a variant" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {chVariants.map((variant) => (
                          <SelectItem key={variant.id} value={variant.id}>
                            {variant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Set Selection - Only show when lab is selected */}
                {selectedLab && (
                  <div className="space-y-3">
                    <Label>Select Set {selectedManufacture && `(Filtered by ${chManufactures.find(m => m.id === selectedManufacture)?.name})`} {selectedVariant && `(${chVariants.find(v => v.id === selectedVariant)?.name})`}</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                      {sets.map((set) => {
                        // Determine signal icon color based on selection state
                        const getSignalColor = () => {
                          if (selectedSet === set.number) {
                            return "text-white"; // White when selected
                          }
                          // Color based on signal strength
                          if (set.signalStrength === "full") return "text-green-500";
                          if (set.signalStrength === "medium") return "text-yellow-500";
                          return "text-red-500";
                        };

                        return (
                          <button
                            key={set.id}
                            onClick={() => handleSetClick(set.number)}
                            className={`p-3 rounded-md border-2 transition-all hover:shadow-md flex flex-col items-center justify-center gap-2 ${
                              selectedSet === set.number
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 bg-white hover:border-blue-400 text-gray-700"
                            }`}
                          >
                            <span className="text-sm font-semibold">Set {set.number}</span>
                            <div className={getSignalColor()}>
                              {set.signalStrength === "full" && <Signal className="size-5" />}
                              {set.signalStrength === "medium" && <SignalLow className="size-5" />}
                              {set.signalStrength === "none" && <SignalZero className="size-5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500">
                      {selectedManufacture || selectedVariant 
                        ? `Showing ${sets.length} filtered set(s). Click on a set number to select.`
                        : `Showing all ${sets.length} sets. Click on a set number to select.`}
                    </p>
                  </div>
                )}

                {/* Selection Summary */}
                {selectedLab && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold mb-3">Current Selection</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Lab:</span>
                        <Badge variant="default">
                          {labs.find((l) => l.lab_id === selectedLab)?.lab_name}
                        </Badge>
                      </div>
                      {selectedManufacture && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Manufacture:</span>
                          <Badge variant="secondary">
                            {chManufactures.find((m) => m.id === selectedManufacture)?.name}
                          </Badge>
                        </div>
                      )}
                      {selectedVariant && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Variant:</span>
                          <Badge variant="secondary">
                            {chVariants.find((v) => v.id === selectedVariant)?.name}
                          </Badge>
                        </div>
                      )}
                      {selectedSet && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Set:</span>
                          <Badge variant="secondary">
                            {sets.find((s) => s.number === selectedSet)?.name}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={handleOpenSet}
                  className="w-full"
                  size="lg"
                  disabled={!selectedSet}
                >
                  Open Selected Set
                </Button>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <p className="text-sm text-gray-600">
                    Copyright © 2025. All rights reserved.
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-sm text-gray-600">
                    Contact us: <a href="mailto:support@gmail.com" className="text-blue-600 hover:underline">support@gmail.com</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}