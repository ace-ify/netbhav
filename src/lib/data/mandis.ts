import type { CostParams, Farmer, Mandi } from "@/lib/types";

// Real APMC mandis across the central-UP (Awadh) belt around Lucknow.
// Coordinates are town/yard-center accurate (OpenStreetMap). A farmer near
// Lucknow has yards from ~15 km (Lucknow) to ~200 km (Kanpur/Gorakhpur side) —
// the spread that makes the "distance eats the difference" story real.
export const MANDIS: Mandi[] = [
  { id: "lucknow", name: "Lucknow (Sitapur Rd)", district: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, enam: true },
  { id: "barabanki", name: "Barabanki", district: "Barabanki", state: "Uttar Pradesh", lat: 26.9257, lng: 81.1866, enam: true },
  { id: "unnao", name: "Unnao", district: "Unnao", state: "Uttar Pradesh", lat: 26.5464, lng: 80.4879 },
  { id: "sitapur", name: "Sitapur", district: "Sitapur", state: "Uttar Pradesh", lat: 27.5679, lng: 80.6819 },
  { id: "hardoi", name: "Hardoi", district: "Hardoi", state: "Uttar Pradesh", lat: 27.3949, lng: 80.1318 },
  { id: "raebareli", name: "Rae Bareli", district: "Rae Bareli", state: "Uttar Pradesh", lat: 26.2224, lng: 81.2337, enam: true },
  { id: "lakhimpur", name: "Lakhimpur Kheri", district: "Lakhimpur Kheri", state: "Uttar Pradesh", lat: 27.9483, lng: 80.7789 },
  { id: "kanpur", name: "Kanpur (Naubasta Grain)", district: "Kanpur Nagar", state: "Uttar Pradesh", lat: 26.4193, lng: 80.3327, enam: true },
  { id: "fatehpur", name: "Fatehpur", district: "Fatehpur", state: "Uttar Pradesh", lat: 25.9304, lng: 80.8137 },
  { id: "sultanpur", name: "Sultanpur", district: "Sultanpur", state: "Uttar Pradesh", lat: 26.2647, lng: 82.0727 },
  { id: "amethi", name: "Amethi (Gauriganj)", district: "Amethi", state: "Uttar Pradesh", lat: 26.0451, lng: 81.6947 },
  { id: "ayodhya", name: "Ayodhya (Faizabad)", district: "Ayodhya", state: "Uttar Pradesh", lat: 26.7733, lng: 82.1548, enam: true },
  { id: "gonda", name: "Gonda", district: "Gonda", state: "Uttar Pradesh", lat: 27.1339, lng: 81.9618 },
  { id: "bahraich", name: "Bahraich", district: "Bahraich", state: "Uttar Pradesh", lat: 27.5743, lng: 81.5941 },
  { id: "pratapgarh", name: "Pratapgarh", district: "Pratapgarh", state: "Uttar Pradesh", lat: 25.8973, lng: 81.9441 },
  { id: "kannauj", name: "Kannauj", district: "Kannauj", state: "Uttar Pradesh", lat: 27.0553, lng: 79.9189 },
  { id: "farrukhabad", name: "Farrukhabad (Fatehgarh)", district: "Farrukhabad", state: "Uttar Pradesh", lat: 27.3906, lng: 79.5809 },
  { id: "shahjahanpur", name: "Shahjahanpur", district: "Shahjahanpur", state: "Uttar Pradesh", lat: 27.8815, lng: 79.9124 },
];

export const MANDI_BY_ID = new Map(MANDIS.map((m) => [m.id, m]));

// Demo farmer: Kakori village, rural Lucknow district (near Lucknow city).
export const DEMO_FARMER: Farmer = {
  name: "Kakori (near Lucknow)",
  district: "Lucknow",
  lat: 26.8106,
  lng: 80.7746,
};

// UTTAR PRADESH APMC (Mandi Parishad) cost model. Sources in README.
// UP mandi shulk (market fee) 1% (halved from 2% in 2020, dev cess folded in);
// arhtiya commission ~2.5%. Fee is legally the buyer's, but in practice it lands
// on the farmer's realized price, so we treat it as a deduction (transparent,
// tunable in UI). Calibration knobs as-of 2025-26.
export const DEFAULT_COST_PARAMS: CostParams = {
  mandiFeePercent: 1.0,
  commissionPercent: 2.5,
  cessPercent: 0.0,
  hamaliPerQuintal: 15, // loading/unloading; UP range ~₹10–25/qtl
  transportPerKm: 40, // hired truck/tractor-trolley; ~₹30–55/km
  truckCapacityQuintals: 100,
  roundTrip: true, // hired vehicle returns empty — you pay the return leg
  roadFactor: 1.35, // straight-line → road distance (rural UP plains)
};

