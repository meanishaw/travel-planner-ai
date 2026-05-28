"use client";
import { Input } from "@/components/ui/input";
import { ChangeEvent, MouseEvent, useRef, useState } from "react";
import { Loading } from "@/components/shared/Loading";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type Prediction = {
  place_id: string;
  description: string;
};

type LocationAutoCompletePropType = {
  planId: string;
  addNewPlaceToTopPlaces: (lat: number, lng: number, placeName: string) => void;
};

const LocationAutoComplete = ({ planId, addNewPlaceToTopPlaces }: LocationAutoCompletePropType) => {
  const [showResults, setShowResults] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const updatePlaceToVisit = useMutation(api.plan.updatePlaceToVisit);

  const fetchPredictions = async (input: string) => {
    if (!input) { setPredictions([]); setShowResults(false); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/places?input=${encodeURIComponent(input)}`);
      const data = await res.json();
      setPredictions(data.predictions || []);
      setShowResults(true);
    } catch (err) {
      console.error("Places fetch error:", err);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (value) {
      debounceTimer.current = setTimeout(() => fetchPredictions(value), 300);
    } else {
      setPredictions([]); setShowResults(false);
    }
  };

  const handleSelectItem = async (e: MouseEvent<HTMLLIElement>, placeId: string, description: string) => {
    e.stopPropagation();
    setShowResults(false);
    setIsSaving(true);
    const { dismiss } = toast({ description: "Adding the selected place!" });
    try {
      const res = await fetch(`/api/places?placeId=${encodeURIComponent(placeId)}`);
      const data = await res.json();
      const result = data.result;
      const lat = result?.lat;
      const lng = result?.lng;
      const name = result?.name || description;
      if (!lat || !lng) throw new Error("No coordinates");
      await updatePlaceToVisit({ placeName: name, lat, lng, planId: planId as Id<"plan"> });
      setSearchQuery("");
      dismiss();
      addNewPlaceToTopPlaces(lat, lng, name);
    } catch (err) {
      console.error("Place details error:", err);
      toast({ description: "Failed to add place. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          disabled={isSaving}
          type="text"
          className="font-light h-12"
          placeholder="Search new location"
          onChange={handleSearch}
          value={searchQuery}
          onBlur={() => setShowResults(false)}
        />
        {isLoading ? (
          <div className="absolute right-3 top-0 h-full flex items-center"><Loading className="w-6 h-6" /></div>
        ) : (
          <div className="absolute right-3 top-0 h-full flex items-center"><Search className="w-4 h-4" /></div>
        )}
      </div>
      {showResults && predictions.length > 0 && (
        <div className="absolute w-full mt-2 shadow-md rounded-xl p-1 bg-background max-h-80 overflow-auto z-50"
          onMouseDown={(e) => e.preventDefault()}>
          <ul className="w-full flex flex-col gap-2" onMouseDown={(e) => e.preventDefault()}>
            {predictions.map((item) => (
              <li className="cursor-pointer border-b flex justify-between items-center hover:bg-muted hover:rounded-lg px-1 py-2 text-sm"
                onClick={(e) => handleSelectItem(e, item.place_id, item.description)}
                key={item.place_id}>
                {item.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LocationAutoComplete;
