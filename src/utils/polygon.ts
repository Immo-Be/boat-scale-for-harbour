import turf, { destination, point, polygon } from "turf";
import { DEFAULT_UNIT, Layer } from "../constants";
import { canvas, map } from "../main";
import transformTranslate from "@turf/transform-translate";

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

function movePolygon(poly: any, newCenter: any): GeoJSON.Polygon {
  // Calculate the current center of the polygon
  const oldCenter = turf.center(poly);

  // Calculate the distance and bearing from the old center to the new center
  const distance = turf.distance(oldCenter, newCenter);
  const bearing = turf.bearing(oldCenter, newCenter);

  // Move the polygon to the new center
  const movedPoly = transformTranslate(poly, distance, bearing);

  return movedPoly;
}

export const onMouseMove = (e: any) => {
  const coords = e.lngLat;

  // Set a UI indicator for dragging.
  canvas.style.cursor = "grabbing";

  const polSource = map.getSource(
    Layer.POLYGONS_SOURCE
  ) as maplibregl.GeoJSONSource;

  const data = polSource._data;

  if (!data || typeof data === "string") {
    console.warn("No polygon data in the polSource._");
    return;
  }
  // @ts-ignore
  const turfPolygon = turf.polygon([data.geometry.coordinates[0]]);

  const turfCenter = point([coords.lng, coords.lat]);
  const movingPoly = movePolygon(turfPolygon, turfCenter);

  polSource.setData(movingPoly);
};

export const onMouseUp = (e: any) => {
  const coords = e.lngLat;
  console.log(`${coords.lat} - ${coords.lng}`);

  // Print the coordinates of where the point had
  // finished being dragged to on the map.
  // coordinates.style.display = "block";
  // coordinates.innerHTML = `Longitude: ${coords.lng}<br />Latitude: ${coords.lat}`;
  canvas.style.cursor = "";

  // Unbind mouse/touch events
  map.off("mousemove", onMouseMove);
  map.off("touchmove", onMouseMove);
};
