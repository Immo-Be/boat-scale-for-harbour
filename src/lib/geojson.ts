const types: { [key: string]: string } = {
  Point: "geometry",
  MultiPoint: "geometry",
  LineString: "geometry",
  MultiLineString: "geometry",
  Polygon: "geometry",
  MultiPolygon: "geometry",
  GeometryCollection: "geometry",
  Feature: "feature",
  FeatureCollection: "featurecollection",
};

const normalize = (gj: any): GeoJSON.FeatureCollection | undefined | null => {
  if (!gj || !gj.type) return null;
  var type = types[gj.type];
  if (!type) return null;

  if (type === "geometry") {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: gj,
        },
      ],
    };
  } else if (type === "feature") {
    return {
      type: "FeatureCollection",
      features: [gj],
    };
  } else if (type === "featurecollection") {
    return gj;
  }
};

export default normalize;
