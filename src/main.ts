import {
  adjustLine,
  createPolygon,
  generateRotationPointAndLine,
  handleRotate,
  onMousePolyGrab,
} from "./utils/polygon";

// There is a new version of turf with a new API and type support
// import turf from "@turf/turf";
// However, there is a bug in the new version that prevents the types from being exported correctly ("@turf/turf v.6.5.0")
// Todo: Update to the new version once the bug is fixed
// Remove noImplicitAny to false in tsconfig.json once fixed
import turf from "turf";
import { CENTER, Layer } from "./constants";
import { getMapInstance, getMapSource, initializeMapLayers } from "./utils/map";
import { MapMouseEvent } from "maplibre-gl";

// Initialize the map
export const map = getMapInstance();

export const collection: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

export const canvas = map.getCanvasContainer();

let isRotating = false;
let isDragging = false;
export let currentPolygonIndex: number | null = null;

const addBoat = (boatProps: Boat) => {
  const poly = createPolygon(
    turf.point([
      CENTER.lng + Math.random() * 0.001,
      CENTER.lat - Math.random() * 0.001,
    ]),
    boatProps
  );

  collection.features.push(poly);

  const polygonSource = getMapSource(map, Layer.POLYGONS_SOURCE);

  if (!polygonSource) {
    console.warn("No valid polygon source", polygonSource);
    return;
  }

  polygonSource.setData(collection);
};

map.once("styledata", () => {
  initializeMapLayers(map, collection);

  if (!collection) {
    console.warn("No valid feature featureCollection", collection);
    return;
  }
});

function onMouseRotateUp() {
  // Unbind mouse/touch events
  map.off("mousemove", handleRotate);
  map.off("touchmove", handleRotate);

  // Reset rotation line
  adjustLine(null, null, true);
  map.setPaintProperty(Layer.POINTS_LAYER, "circle-opacity", 0);
  isRotating = false;
  currentPolygonIndex = null;
}

function onMouseUp(event: MapMouseEvent) {
  const coords = event.lngLat;
  console.log(`${coords.lat} - ${coords.lng}`);

  // Print the coordinates of where the point had
  // finished being dragged to on the map.
  // coordinates.style.display = "block";
  // coordinates.innerHTML = `Longitude: ${coords.lng}<br />Latitude: ${coords.lat}`;
  canvas.style.cursor = "";
  isDragging = false;
  currentPolygonIndex = null;

  // Unbind mouse/touch events
  map.off("mousemove", onMousePolyGrab);
  map.off("touchmove", onMousePolyGrab);
}

// When the cursor enters a feature in
// the point layer, prepare for dragging.
map.on("mousemove", Layer.POLYGONS_LAYER, (event) => {
  event.preventDefault();
  if (isRotating || isDragging) {
    return;
  }

  const { properties } = map.queryRenderedFeatures(event.point, {
    layers: [Layer.POLYGONS_LAYER],
  })[0];

  const id = properties.id;

  currentPolygonIndex = collection.features.findIndex(
    (feature) => feature.properties?.id === id
  );

  // Generate rotation point and line for the current polygon
  const polygon = collection.features[
    currentPolygonIndex
  ] as unknown as GeoJSON.Polygon;

  generateRotationPointAndLine(polygon);

  const point = map.queryRenderedFeatures(event.point, {
    layers: [Layer.POINTS_LAYER],
  });

  const isPointInPolygon = Boolean(point.length);

  if (isPointInPolygon) {
    canvas.style.cursor = "";
    map.on("mousedown", Layer.POINTS_LAYER, (event: MapMouseEvent) => {
      event.preventDefault();

      isRotating = true;

      map.on("mousemove", handleRotate);

      map.once("mouseup", onMouseRotateUp);

      // Prevent the polygon feature from being dragged
      map.off("mousemove", onMousePolyGrab);
      map.off("touchmove", onMousePolyGrab);
    });
  } else {
    if (isRotating) {
      return;
    }
    canvas.style.cursor = "move";

    // Get point layer and set color to red
    if (!isDragging) {
      map.setPaintProperty(Layer.POINTS_LAYER, "circle-opacity", 0.8);
    }

    map.on("mousedown", Layer.POLYGONS_LAYER, (event: MapMouseEvent) => {
      event.preventDefault();
      isDragging = true;

      canvas.style.cursor = "grab";

      map.on("mousemove", onMousePolyGrab);
      map.once("mouseup", onMouseUp);
    });
  }
});

map.on("mouseleave", Layer.POLYGONS_LAYER, () => {
  canvas.style.cursor = "";

  // Reset the point layer's color
  if (!isRotating) {
    map.setPaintProperty(Layer.POINTS_LAYER, "circle-opacity", 0);
  }
});

const sidebarToggle = document.querySelector(".sidebar-collapse-toggle");

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    const main = document.querySelector(".main-container");
    main!.classList.toggle("sidebar-is-collapsed");
  });
} else {
  console.warn(
    "No sidebar toggle found. Please add a button with the class 'sidebar-collapse-toggle' to the index.html file."
  );
}

const form = document.querySelector("form");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const formProps = Object.fromEntries(formData) as Boat;
    addBoat(formProps);
  });
} else {
  console.warn(
    "No form found. Please add a form with the class 'boat-form' to the index.html file."
  );
}
