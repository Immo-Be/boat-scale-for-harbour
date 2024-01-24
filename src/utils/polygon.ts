import turf, { destination, lineString, point, polygon } from "turf";
import { DEFAULT_UNIT, Layer } from "../constants";
import { canvas, map } from "../main";
import transformTranslate from "@turf/transform-translate";
import rotate from "@turf/transform-rotate";
import { GeoJSONSource } from "maplibre-gl";

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

export const createPoint = (polygon: any) => {
  // Calculate the middle of the polygon
  const rotationPoint = turf.center(polygon as any);
  const source = Layer.POINTS_SOURCE;

  map.addSource(source, {
    type: "geojson",
    data: rotationPoint,
  });

  map.addLayer({
    id: Layer.POINTS,
    type: "circle",
    source: source,
    paint: {
      "circle-radius": 6,
      "circle-color": "red",
      "circle-opacity": 0,
      // @ts-ignore
      "circle-opacity-transition": {
        duration: 0,
      },
    },
  });
};

export const createStringLine = (center: any) => {
  // Create a line from the center of the polygon to the point above
  const lineToAbove = lineString(
    [center.geometry.coordinates, center.geometry.coordinates],
    {
      strokeWidth: 3, // Adjust the value to make the line thicker
    }
  );

  // Add the new source and layer
  map.addSource(Layer.LINE_SOURCE, {
    type: "geojson",
    data: lineToAbove,
  });

  map.addLayer({
    id: Layer.LINE,
    type: "line",
    source: Layer.LINE_SOURCE,
    paint: {
      "line-color": "#f00",
      "line-width": 3,
    },
  });
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

function movePoint(center): GeoJSON.Point {
  const movedPoint = point([
    center.geometry.coordinates[0],
    center.geometry.coordinates[1],
  ]);

  // Calculate the current center of the polygon
  // const oldCenter = turf.center(point);

  // // Calculate the distance and bearing from the old center to the new center
  // const distance = turf.distance(oldCenter, newCenter);
  // const bearing = turf.bearing(oldCenter, newCenter);

  // // Move the polygon to the new center
  // const movedPoint = transformTranslate(point, distance, bearing);

  return center;
}

export const onMousePolyGrab = (e: any) => {
  map.setPaintProperty(Layer.POINTS, "circle-opacity", 0);

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

  const turfCenterPoint = point([coords.lng, coords.lat]);
  const movingPoly = movePolygon(turfPolygon, turfCenterPoint);

  polSource.setData(movingPoly);

  const movedPoint = movePoint(turfCenterPoint);

  const pointSource = map.getSource(
    Layer.POINTS_SOURCE
  ) as maplibregl.GeoJSONSource;

  pointSource.setData(movedPoint);
};

let prevBearing = 0;

function rotatePolygon(rotation: number) {
  const polSource = map.getSource(
    Layer.POLYGONS_SOURCE
  ) as maplibregl.GeoJSONSource;

  const data = polSource._data;

  if (!data || typeof data === "string") {
    console.warn("No polygon data in the polSource._");
    return;
  }
  // @ts-ignore
  const poly = polygon([data.geometry.coordinates[0]]);

  const polSo2urce = map.getSource(
    Layer.POINTS_SOURCE
  ) as maplibregl.GeoJSONSource;

  const da2ta = polSo2urce._data;

  if (!data || typeof data === "string") {
    console.warn("No polygon data in the polSource._");
    return;
  }

  const rotated = rotate(poly, rotation, {
    // @ts-ignore
    pivot: point(da2ta.geometry.coordinates),
  });
  polSource.setData(rotated);
}

export const handleRotate = (event: any) => {
  // Get point source
  const pointSource = map.getSource(
    Layer.POINTS_SOURCE
  ) as maplibregl.GeoJSONSource;

  const data = pointSource._data;

  if (!data || typeof data === "string") {
    console.warn("No point data in the pointSource._");
    return;
  }

  const mouse = point([event.lngLat.lng, event.lngLat.lat]);
  // @ts-ignore
  const bearing = turf.bearing(data, mouse);

  // Get point coordinates
  // @ts-ignore
  const coords = data.geometry.coordinates;

  // Rotate the point
  rotatePolygon(bearing - prevBearing);
  adjustLine(event, coords);
  prevBearing = bearing;
};

export const adjustLine = (e: any, origin: any, isReset?: boolean) => {
  const lineSource = map.getSource(Layer.LINE_SOURCE) as GeoJSONSource;

  if (!lineSource) {
    console.warn("No point source found.");
    return;
  }

  const data = lineSource._data as GeoJSON.Feature<GeoJSON.LineString>;

  if (
    !data ||
    typeof data === "string" ||
    !Array.isArray(data.geometry.coordinates)
  ) {
    console.warn("No point data in the pointSource.");
    return;
  }

  if (isReset) {
    // Get point source
    const pointSource = map.getSource(
      Layer.POINTS_SOURCE
    ) as maplibregl.GeoJSONSource;

    const data = pointSource._data;

    if (!data || typeof data === "string") {
      console.warn("No point data in the pointSource._");
      return;
    }

    // @ts-ignore
    const coords = data.geometry.coordinates;
    const resetLine = lineString([coords, coords]);
    lineSource.setData(resetLine);
    return;
  }
  const mouse = point([e.lngLat.lng, e.lngLat.lat]);

  const lineToMouse = lineString([origin, mouse.geometry.coordinates]);
  lineSource.setData(lineToMouse);
};
