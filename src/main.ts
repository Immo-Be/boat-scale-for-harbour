import maplibregl from "maplibre-gl";
import { mapStyle } from "./map-styles";
import {
  adjustLine,
  createPoint,
  createPolygon,
  createStringLine,
  handleRotate,
  onMousePolyGrab,
} from "./utils/polygon";
// import { polygon } from "turf";

// There is a new version of turf with a new API and type support
// import turf from "@turf/turf";
// However, there is a bug in the new version that prevents the types from being exported correctly ("@turf/turf v.6.5.0")
// Todo: Update to the new version once the bug is fixed
// Remove noImplicitAny to false in tsconfig.json once fixed
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

let isRotating = false;
let isDragging = false;

map.addControl(scale);

const turfCenter = turf.point([CENTER.lng, CENTER.lat]);

map.once("styledata", () => {
  const geojson = createPolygon(turfCenter, 50, 6.6);

  const rotationPoint = turf.center(geojson as any);

  createStringLine(rotationPoint);
  createPoint(geojson);

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
      "fill-opacity": 0.7,
    },
  });
  map.moveLayer(Layer.POLYGONS, Layer.POINTS);
});

function onMouseRotateUp() {
  // Unbind mouse/touch events
  map.off("mousemove", handleRotate);
  map.off("touchmove", handleRotate);

  //

  // Reset rotation line
  adjustLine(null, null, true);
  map.setPaintProperty(Layer.POINTS, "circle-opacity", 0);
  isRotating = false;
}

function onMouseUp(e: any) {
  const coords = e.lngLat;
  // console.log(`${coords.lat} - ${coords.lng}`);

  // Print the coordinates of where the point had
  // finished being dragged to on the map.
  // coordinates.style.display = "block";
  // coordinates.innerHTML = `Longitude: ${coords.lng}<br />Latitude: ${coords.lat}`;
  canvas.style.cursor = "";
  isDragging = false;

  // Unbind mouse/touch events
  map.off("mousemove", onMousePolyGrab);
  map.off("touchmove", onMousePolyGrab);
}

// When the cursor enters a feature in
// the point layer, prepare for dragging.
map.on("mousemove", Layer.POLYGONS, (event) => {
  //map.setPaintProperty('point', 'circle-color', '#3bb2d0');

  const point = map.queryRenderedFeatures(event.point, {
    layers: [Layer.POINTS],
  });
  console.log("🚀 ~ map.on ~ point:", point);

  const isPointInPolygon = Boolean(point.length);
  console.log("🚀 ~ map.on ~ point:", isPointInPolygon);

  if (isPointInPolygon) {
    canvas.style.cursor = "";
    map.on("mousedown", Layer.POINTS, (e) => {
      e.preventDefault();

      isRotating = true;

      map.on("mousemove", handleRotate);

      map.once("mouseup", onMouseRotateUp);

      // Prevent the polygon feature from being dragged
      map.off("mousemove", onMousePolyGrab);
      map.off("touchmove", onMousePolyGrab);
    });
  } else if (!isRotating) {
    canvas.style.cursor = "move";

    // Get point layer and set color to red
    if (!isDragging) {
      map.setPaintProperty(Layer.POINTS, "circle-opacity", 0.8);
    }

    map.on("mousedown", Layer.POLYGONS, (event) => {
      event.preventDefault();
      isDragging = true;
      console.log("🚀 ~ map.on ~ isDragging:", isDragging);
      console.log("isPointInPolygon", isPointInPolygon);

      canvas.style.cursor = "grab";

      map.on("mousemove", onMousePolyGrab);
      map.once("mouseup", onMouseUp);
    });
  }
});

map.on("mouseleave", Layer.POLYGONS, () => {
  canvas.style.cursor = "";

  // Reset the point layer's color
  if (!isRotating) {
    map.setPaintProperty(Layer.POINTS, "circle-opacity", 0);
  }
});

// map.on("touchstart", Layer.POLYGONS, (e) => {
//   if (e.points.length !== 1) return;

//   // Prevent the default map drag behavior.
//   e.preventDefault();

//   map.on("touchmove", onMousePolyGrab);
//   map.once("touchend", onMouseUp);
// });

const sidebarToggle = document.querySelector(".sidebar-collapse-toggle");

sidebarToggle!.addEventListener("click", () => {
  const main = document.querySelector(".main-container");
  main!.classList.toggle("sidebar-is-collapsed");
});
