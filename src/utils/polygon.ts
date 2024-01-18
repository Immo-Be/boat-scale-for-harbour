import { destination, point, polygon } from "turf";
import { DEFAULT_UNIT, Layer } from "../constants";
import { canvas, map } from "../main";

// The factor by which the triangle protrudes from the rectangle aka the ship polygon
// 0.15 means that the triangle in front makes up 15% of the total length of the ship
const PROTRUSION_FACTOR = 0.15;

export const createPolygon = (
  center: any,
  length: number, // height is "Länge" in German
  width: number // width is "Breite" in German
): any => {
  const lengthWithOutProtrusion = length * (1 - PROTRUSION_FACTOR);

  // Convert width and height to kilometers
  const westPoint = destination(
    center,
    lengthWithOutProtrusion / 2,
    -90,
    DEFAULT_UNIT
  );
  const eastPoint = destination(
    center,
    lengthWithOutProtrusion / 2,
    90,
    DEFAULT_UNIT
  );
  const northPoint = destination(center, width / 2, 0, DEFAULT_UNIT);
  const southPoint = destination(center, width / 2, 180, DEFAULT_UNIT);

  const minLng = westPoint.geometry.coordinates[0];
  const maxLng = eastPoint.geometry.coordinates[0];
  const minLat = southPoint.geometry.coordinates[1];
  const maxLat = northPoint.geometry.coordinates[1];

  // Calculate the point for the triangle
  const trianglePoint = destination(
    eastPoint,
    (length * (PROTRUSION_FACTOR * 2)) / 2,
    90,
    DEFAULT_UNIT
  );

  // Create the polygon with a triangle on the right side
  const createdPolygon = polygon([
    [
      [minLng, minLat],
      [minLng, maxLat],
      [maxLng, maxLat],
      [
        trianglePoint.geometry.coordinates[0],
        trianglePoint.geometry.coordinates[1],
      ],
      [maxLng, minLat],
      [minLng, minLat],
    ],
  ]);

  return createdPolygon;
};

export const onMove = (e: any) => {
  const coords = e.lngLat;

  // Set a UI indicator for dragging.
  canvas.style.cursor = "grabbing";

  // Update the Point feature in `geojson` coordinates
  // and call setData to the source layer `point` on it.
  //geojson.features[0].geometry.coordinates = [coords.lng, coords.lat];

  const turfCenter = point([coords.lng, coords.lat]);

  const updated_geojson = createPolygon(turfCenter, 50, 6.6);

  const polSource = map.getSource(
    Layer.POLYGONS_SOURCE
  ) as maplibregl.GeoJSONSource;
  polSource.setData(updated_geojson);
};

export const onUp = (e: any) => {
  const coords = e.lngLat;
  console.log(`${coords.lat} - ${coords.lng}`);

  // Print the coordinates of where the point had
  // finished being dragged to on the map.
  // coordinates.style.display = "block";
  // coordinates.innerHTML = `Longitude: ${coords.lng}<br />Latitude: ${coords.lat}`;
  canvas.style.cursor = "";

  // Unbind mouse/touch events
  map.off("mousemove", onMove);
  map.off("touchmove", onMove);
};
