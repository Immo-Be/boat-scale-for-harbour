import { CENTER, Layer } from "../constants";
import maplibregl, { Map } from "maplibre-gl";
import { mapStyle } from "../map-styles";
import turf from "turf";

/**
 * Returns an instance of the map.
 * @returns {maplibregl.Map} The map instance.
 */
export const getMapInstance = () => {
  const map = new maplibregl.Map({
    container: "map",
    style: mapStyle,
    center: [CENTER.lng, CENTER.lat],
    zoom: 17,
  });

  // Add zoom and scale controls to the map.
  const naviControl = new maplibregl.NavigationControl();
  map.addControl(naviControl);

  const scale = new maplibregl.ScaleControl({
    unit: "metric",
    maxWidth: 200,
  });

  map.addControl(scale);

  return map;
};

/**
 * sources and layers for the polygons, points and line
 * @param map
 */
export const initializeMapLayers = (
  map: Map,
  featureCollection: GeoJSON.FeatureCollection
) => {
  // Add the source and layer for the polygons
  map.addSource(Layer.POLYGONS_SOURCE, {
    type: "geojson",
    data: featureCollection,
  });

  map.addLayer({
    id: Layer.POLYGONS_LAYER,
    type: "fill",
    source: Layer.POLYGONS_SOURCE,
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": 0.7,
    },
  });

  // Add the source and layer for the points
  map.addSource(Layer.POINTS_SOURCE, {
    type: "geojson",
    data: null,
  });

  map.addLayer({
    id: Layer.POINTS_LAYER,
    type: "circle",
    source: Layer.POINTS_SOURCE,
    paint: {
      "circle-radius": 6.5,
      "circle-color": "white",
    },
  });

  // Add the source and layer for the line
  map.addSource(Layer.LINE_SOURCE, {
    type: "geojson",
    data: null,
  });

  map.addLayer({
    id: Layer.LINE_Layer,
    type: "line",
    source: Layer.LINE_SOURCE,
    paint: {
      "line-color": "#f00",
      "line-width": 2,
    },
  });

  map.moveLayer(Layer.POLYGONS_LAYER, Layer.POINTS_LAYER);
};

export const getMapSource = (map: Map, sourceId: Layer) => {
  const source = map.getSource(sourceId);

  if (!source) {
    console.warn("No valid source", source);
    return null;
  }

  return source as maplibregl.GeoJSONSource;
};

export const getCenterOfPolygon = (polygon: GeoJSON.Polygon) => {
  const center = turf.center(polygon as any);

  if (!center || !center.geometry || !center.geometry.coordinates) {
    console.warn("No valid center", center);
    return null;
  }

  return center;
};
