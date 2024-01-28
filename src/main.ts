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
import turf, { polygon } from "turf";
import { CENTER, Layer } from "./constants";
import { getMapInstance, getMapSource, initializeMapLayers } from "./utils/map";
import { MapMouseEvent } from "maplibre-gl";

// Initialize the map
export const map = getMapInstance();

export const collection: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    // createPolygon(
    //   turf.point([
    //     CENTER.lng + Math.random() * 0.001,
    //     CENTER.lat - Math.random() * 0.001,
    //   ]),
    //   50,
    //   6.6
    // ),
  ],
};

export const canvas = map.getCanvasContainer();

let isRotating = false;
let isDragging = false;
export let currentPolygonIndex: number | null = null;

// const turfCenter = turf.point([
//   CENTER.lng + Math.random() * 0.001,
//   CENTER.lat - Math.random() * 0.001,
// ]);

const addBoat = () => {
  const poly = createPolygon(
    turf.point([
      CENTER.lng + Math.random() * 0.001,
      CENTER.lat - Math.random() * 0.001,
    ]),
    50,
    6.6
  );

  collection.features.push(poly);

  const polygonSource = getMapSource(map, Layer.POLYGONS_SOURCE);

  if (!polygonSource) {
    console.warn("No valid polygon source", polygonSource);
    return;
  }

  polygonSource.setData(collection);

  // generateRotationPointAndLine(poly);
};

function generateRotationPointAndLine(polygon: GeoJSON.Polygon) {
  const geoPoint = createPoint(polygon);

  const pointSource = getMapSource(map, Layer.POINTS_SOURCE);

  if (!pointSource || !geoPoint) {
    console.warn("No valid point or  point source", pointSource, geoPoint);
    return;
  }

  pointSource.setData(geoPoint);

  const geoLine = createStringLine(polygon);

  const lineSource = getMapSource(map, Layer.LINE_SOURCE);

  if (!lineSource || !geoLine) {
    console.warn("No valid line or line source", lineSource, geoLine);
    return;
  }

  lineSource.setData(geoLine);

  // const center = turf.centerOfMass(geojson);
  // const point = createPoint(center);
  // const line = createStringLine(center);
  // const pointSource = getMapSource(map, Layer.POINTS_SOURCE);
  // if (!pointSource) {
  //   console.warn("No valid point source", pointSource);
  //   return;
  // }
  // pointSource.setData(point);
  // const lineSource = getMapSource(map, Layer.LINE_SOURCE);
  // if (!lineSource) {
  //   console.warn("No valid line source", lineSource);
  //   return;
  // }
  // lineSource.setData(line);
}

map.once("styledata", () => {
  initializeMapLayers(map, collection);
  // boatAdded();
  // boatAdded();

  // const collection = normalize();
  // console.log("🚀 ~ map.once ~ collection:", collection);

  // const geojson2 = createPolygon(
  //   turf.point([
  //     CENTER.lng + Math.random() * 0.001,
  //     CENTER.lat - Math.random() * 0.001,
  //   ]),
  //   50,
  //   6.6
  // );

  if (!collection) {
    console.warn("No valid feature featureCollection", collection);
    return;
  }

  // featureCollection.features.push(geojson2);
  // console.log("🚀 ~ map.once ~ featureCollection:", featureCollection);

  // map.addSource(Layer.POLYGONS_SOURCE, {
  //   type: "geojson",
  //   data: featureCollection,
  // });
  // map.addLayer({
  //   id: Layer.POLYGONS,
  //   type: "fill",
  //   source: Layer.POLYGONS_SOURCE,
  //   layout: {},
  //   paint: {
  //     "fill-color": ["get", "color"],
  //     "fill-opacity": 0.7,
  //   },
  // });
});

function onMouseRotateUp() {
  // Unbind mouse/touch events
  map.off("mousemove", handleRotate);
  map.off("touchmove", handleRotate);

  //

  // Reset rotation line
  adjustLine(null, null, true);
  map.setPaintProperty(Layer.POINTS_LAYER, "circle-opacity", 0);
  isRotating = false;
  currentPolygonIndex = null;
}

function onMouseUp(e: MapMouseEvent) {
  const coords = e.lngLat;
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
  //map.setPaintProperty('point', 'circle-color', '#3bb2d0');

  const point = map.queryRenderedFeatures(event.point, {
    layers: [Layer.POINTS_LAYER],
  });

  const { properties } = map.queryRenderedFeatures(event.point, {
    layers: [Layer.POLYGONS_LAYER],
  })[0];

  const id = properties.id;

  currentPolygonIndex = collection.features.findIndex(
    (feature) => feature.properties?.id === id
  );
  // console.log("🚀 ~ map.on ~ polygon:", polygon);

  const isPointInPolygon = Boolean(point.length);

  if (isPointInPolygon) {
    canvas.style.cursor = "";
    map.on("mousedown", Layer.POINTS_LAYER, (e) => {
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
      map.setPaintProperty(Layer.POINTS_LAYER, "circle-opacity", 0.8);
    }

    map.on("mousedown", Layer.POLYGONS_LAYER, (event) => {
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

const form = document.querySelector("form");

form!.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(e.target as HTMLFormElement);
  const formProps = Object.fromEntries(formData);
  addBoat();

  console.log("🚀 ~ form!.addEventListener ~ formProps:", formProps);
});
