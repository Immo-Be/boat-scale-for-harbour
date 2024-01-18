import maplibregl from "maplibre-gl";
import { mapStyle } from "./map-styles";
import { createPolygon, onMove, onUp } from "./utils/polygon";

// There is a new version of turf with a new API and type support
// import turf from "@turf/turf";
// However, there is a bug in the new version that prevents the types from being exported correctly ("@turf/turf v.6.5.0")
// Todo: Update to the new version once the bug is fixed
import turf from "turf";
import { CENTER, Layer } from "./constants";

// Initialize the map
export const map = new maplibregl.Map({
  container: "map",
  style: mapStyle,
  center: [CENTER.lng, CENTER.lat],
  zoom: 17,
});

export const canvas = map.getCanvasContainer();

// Add zoom and scale controls to the map.
const naviControl = new maplibregl.NavigationControl();
map.addControl(naviControl);

const scale = new maplibregl.ScaleControl({
  unit: "metric",
  maxWidth: 200,
});
map.addControl(scale);

// Convert center to a turf point

map.once("styledata", () => {
  const turfCenter = turf.point([CENTER.lng, CENTER.lat]);
  const geojson = createPolygon(turfCenter, 50, 6.6);

  map.addSource(Layer.POLYGONS_SOURCE, {
    type: "geojson",
    data: geojson,
  });
  map.addLayer({
    id: Layer.POLYGONS,
    type: "fill",
    source: Layer.POLYGONS_SOURCE,
    layout: {},
    paint: {
      "fill-color": "#088",
      "fill-opacity": 0.8,
    },
  });
});

// When the cursor enters a feature in
// the point layer, prepare for dragging.
map.on("mouseenter", Layer.POLYGONS, () => {
  //map.setPaintProperty('point', 'circle-color', '#3bb2d0');
  canvas.style.cursor = "move";
});

map.on("mouseleave", Layer.POLYGONS, () => {
  //map.setPaintProperty('point', 'circle-color', '#3887be');
  canvas.style.cursor = "";
});

map.on("mousedown", Layer.POLYGONS, (e) => {
  // Prevent the default map drag behavior.
  e.preventDefault();

  canvas.style.cursor = "grab";

  map.on("mousemove", onMove);
  map.once("mouseup", onUp);
});

map.on("touchstart", Layer.POLYGONS, (e) => {
  if (e.points.length !== 1) return;

  // Prevent the default map drag behavior.
  e.preventDefault();

  map.on("touchmove", onMove);
  map.once("touchend", onUp);
});
