// Circuit coordinates keyed by Jolpica/Ergast circuitId. Used by the Race
// Weather Center; the timing APIs do not expose a usable forecast feed.

export interface CircuitGeo {
  lat: number;
  lon: number;
}

export const CIRCUIT_GEO: Record<string, CircuitGeo> = {
  bahrain: { lat: 26.0325, lon: 50.5106 },
  jeddah: { lat: 21.6319, lon: 39.1044 },
  albert_park: { lat: -37.8497, lon: 144.968 },
  suzuka: { lat: 34.8431, lon: 136.541 },
  shanghai: { lat: 31.3389, lon: 121.22 },
  miami: { lat: 25.9581, lon: -80.2389 },
  imola: { lat: 44.3439, lon: 11.7167 },
  monaco: { lat: 43.7347, lon: 7.4206 },
  catalunya: { lat: 41.57, lon: 2.2611 },
  villeneuve: { lat: 45.5, lon: -73.5228 },
  red_bull_ring: { lat: 47.2197, lon: 14.7647 },
  silverstone: { lat: 52.0786, lon: -1.01694 },
  spa: { lat: 50.4372, lon: 5.97139 },
  hungaroring: { lat: 47.5789, lon: 19.2486 },
  zandvoort: { lat: 52.3888, lon: 4.54092 },
  monza: { lat: 45.6156, lon: 9.28111 },
  baku: { lat: 40.3725, lon: 49.8533 },
  marina_bay: { lat: 1.2914, lon: 103.864 },
  americas: { lat: 30.1328, lon: -97.6411 },
  rodriguez: { lat: 19.4042, lon: -99.0907 },
  interlagos: { lat: -23.7036, lon: -46.6997 },
  vegas: { lat: 36.1147, lon: -115.173 },
  losail: { lat: 25.49, lon: 51.4542 },
  yas_marina: { lat: 24.4672, lon: 54.6031 },
  madring: { lat: 40.4653, lon: -3.6167 },
  jarama: { lat: 40.6171, lon: -3.5859 },
  portimao: { lat: 37.227, lon: -8.6267 },
  mugello: { lat: 43.9975, lon: 11.3719 },
  istanbul: { lat: 40.9517, lon: 29.405 },
  sochi: { lat: 43.4057, lon: 39.9578 },
  ricard: { lat: 43.2506, lon: 5.79167 },
  hockenheimring: { lat: 49.3278, lon: 8.56583 },
  sepang: { lat: 2.76083, lon: 101.738 },
};

export function geoFor(circuitId: string): CircuitGeo | undefined {
  return CIRCUIT_GEO[circuitId];
}
