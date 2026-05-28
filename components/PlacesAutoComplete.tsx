"use client";
import { Input } from "@/components/ui/input";
import {
  ChangeEvent,
  Dispatch,
  MouseEvent,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { Loading } from "@/components/shared/Loading";
import { ControllerRenderProps, UseFormReturn } from "react-hook-form";
import { formSchemaType } from "@/components/NewPlanForm";

type Prediction = {
  place_id: string;
  description: string;
};

type PlacesAutoCompleteProps = {
  selectedFromList: boolean;
  setSelectedFromList: Dispatch<SetStateAction<boolean>>;
  form: UseFormReturn<formSchemaType, any, undefined>;
  field: ControllerRenderProps<formSchemaType, "placeName">;
};

const PlacesAutoComplete = ({
  form,
  field,
  selectedFromList,
  setSelectedFromList,
}: PlacesAutoCompleteProps) => {
  const [showResults, setShowResults] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEnglish = (text: string) => /^[A-Za-z0-9\s,.-]+$/.test(text);

  const fetchPredictions = async (input: string) => {
    if (!input) {
      setPredictions([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      // Calls your own Next.js API route (avoids CORS issues)
      const res = await fetch(`/api/places?input=${encodeURIComponent(input)}`);
      const data = await res.json();
      if (data.predictions) {
        setPredictions(data.predictions);
        setShowResults(true);
      }
    } catch (err) {
      console.error("Places fetch error:", err);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!value) {
      field.onChange(value);
      setPredictions([]);
      setShowResults(false);
      return;
    }

    if (!isEnglish(value)) {
      form.setError("placeName", {
        message: "This tool supports only english as input as of now.",
        type: "custom",
      });
      return;
    }

    if (selectedFromList) {
      form.setError("placeName", {
        message: "Place should be selected from the list",
        type: "custom",
      });
      setSelectedFromList(false);
    }

    field.onChange(value);

    // Debounce API call
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchPredictions(value);
    }, 300);
  };

  const handleSelectItem = (e: MouseEvent<HTMLLIElement>, description: string) => {
    e.stopPropagation();
    form.clearErrors("placeName");
    setShowResults(false);
    setSelectedFromList(true);
    form.setValue("placeName", description);
    setPredictions([]);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search for your destination city..."
          onChange={handleSearch}
          onBlur={() => setShowResults(false)}
          value={field.value}
        />
        {isLoading && (
          <div className="absolute right-3 top-0 h-full flex items-center">
            <Loading className="w-6 h-6" />
          </div>
        )}
      </div>
      {showResults && predictions.length > 0 && (
        <div
          className="absolute w-full mt-2 shadow-md rounded-xl p-1 bg-background max-h-80 overflow-auto z-50"
          onMouseDown={(e) => e.preventDefault()}
        >
          <ul
            className="w-full flex flex-col gap-2"
            onMouseDown={(e) => e.preventDefault()}
          >
            {predictions.map((item) => (
              <li
                className="cursor-pointer border-b flex justify-between items-center hover:bg-muted hover:rounded-lg px-1 py-2 text-sm"
                onClick={(e) => handleSelectItem(e, item.description)}
                key={item.place_id}
              >
                {item.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlacesAutoComplete;
