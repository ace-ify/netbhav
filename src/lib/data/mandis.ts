import type { CostParams, Farmer, Mandi } from "@/lib/types";

// Real APMC mandis across the Malwa / Nimar belt of Madhya Pradesh.
// Coordinates are town/yard-center accurate (OpenStreetMap). A farmer near
// Indore has yards from ~7 km (Choithram) to ~200 km (Bhopal Karond) away —
// the spread that makes the "distance eats the difference" story real.
export const MANDIS: Mandi[] = [
  { id: "indore-choithram", name: "Indore (Choithram)", district: "Indore", state: "Madhya Pradesh", lat: 22.683, lng: 75.841 },
  { id: "indore-chhawni", name: "Indore (Chhawni Grain Mandi)", district: "Indore", state: "Madhya Pradesh", lat: 22.728, lng: 75.86, enam: true },
  { id: "mhow", name: "Mhow (Dr. Ambedkar Nagar)", district: "Indore", state: "Madhya Pradesh", lat: 22.554, lng: 75.763 },
  { id: "sanwer", name: "Sanwer", district: "Indore", state: "Madhya Pradesh", lat: 22.974, lng: 75.827 },
  { id: "depalpur", name: "Depalpur", district: "Indore", state: "Madhya Pradesh", lat: 22.856, lng: 75.542 },
  { id: "dewas", name: "Dewas", district: "Dewas", state: "Madhya Pradesh", lat: 22.966, lng: 76.053, enam: true },
  { id: "sonkatch", name: "Sonkatch", district: "Dewas", state: "Madhya Pradesh", lat: 22.976, lng: 76.349 },
  { id: "bagli", name: "Bagli", district: "Dewas", state: "Madhya Pradesh", lat: 22.647, lng: 76.347 },
  { id: "kannod", name: "Kannod", district: "Dewas", state: "Madhya Pradesh", lat: 22.667, lng: 76.742 },
  { id: "khategaon", name: "Khategaon", district: "Dewas", state: "Madhya Pradesh", lat: 22.596, lng: 76.916 },
  { id: "ujjain-chimanganj", name: "Ujjain (Chimanganj Mandi)", district: "Ujjain", state: "Madhya Pradesh", lat: 23.199, lng: 75.788, enam: true },
  { id: "badnagar", name: "Badnagar", district: "Ujjain", state: "Madhya Pradesh", lat: 23.283, lng: 75.525 },
  { id: "tarana", name: "Tarana", district: "Ujjain", state: "Madhya Pradesh", lat: 23.335, lng: 76.047 },
  { id: "nagda", name: "Nagda", district: "Ujjain", state: "Madhya Pradesh", lat: 23.456, lng: 75.418 },
  { id: "dhar", name: "Dhar", district: "Dhar", state: "Madhya Pradesh", lat: 22.6, lng: 75.302, enam: true },
  { id: "badnawar", name: "Badnawar", district: "Dhar", state: "Madhya Pradesh", lat: 23.02, lng: 75.233 },
  { id: "ratlam", name: "Ratlam", district: "Ratlam", state: "Madhya Pradesh", lat: 23.332, lng: 75.04, enam: true },
  { id: "jaora", name: "Jaora", district: "Ratlam", state: "Madhya Pradesh", lat: 23.638, lng: 75.127 },
  { id: "shajapur", name: "Shajapur", district: "Shajapur", state: "Madhya Pradesh", lat: 23.427, lng: 76.277 },
  { id: "shujalpur", name: "Shujalpur", district: "Shajapur", state: "Madhya Pradesh", lat: 23.404, lng: 76.704 },
  { id: "sehore", name: "Sehore", district: "Sehore", state: "Madhya Pradesh", lat: 23.2, lng: 77.085, enam: true },
  { id: "ashta", name: "Ashta", district: "Sehore", state: "Madhya Pradesh", lat: 23.018, lng: 76.722 },
  { id: "agar-malwa", name: "Agar Malwa", district: "Agar Malwa", state: "Madhya Pradesh", lat: 23.712, lng: 76.015 },
  { id: "bhopal-karond", name: "Bhopal (Karond Mandi)", district: "Bhopal", state: "Madhya Pradesh", lat: 23.287, lng: 77.406 },
];

export const MANDI_BY_ID = new Map(MANDIS.map((m) => [m.id, m]));

// Demo farmer: Rangwasa village, rural Indore district (near Rau).
export const DEMO_FARMER: Farmer = {
  name: "Rangwasa (near Rau)",
  district: "Indore",
  lat: 22.6255,
  lng: 75.7935,
};

// MADHYA PRADESH APMC cost model. Sources in README.
// MP market fee 1.5% + ~0.2% nirashrit (relief) cess; arhtiya commission ~2%.
// Fee is legally the buyer's, but in practice it lands on the farmer's realized
// price, so we treat it as a deduction (transparent assumption, tunable in UI).
export const DEFAULT_COST_PARAMS: CostParams = {
  mandiFeePercent: 1.5,
  commissionPercent: 2.0,
  cessPercent: 0.2,
  hamaliPerQuintal: 15, // loading/unloading; MP range ~₹10–25/qtl
  transportPerKm: 40, // hired truck/tractor-trolley; MP range ~₹30–55/km
  truckCapacityQuintals: 100,
  roundTrip: true, // hired vehicle returns empty — you pay the return leg
  roadFactor: 1.35, // straight-line → road distance (rural MP)
};
