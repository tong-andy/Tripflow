# World boundary asset

`world-110m.svg` is generated from Natural Earth Admin 0 Countries at 1:110m scale using `scripts/generate-world-svg.mjs`.

- Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson
- Natural Earth data is public domain.
- Projection used by TripFlow: simple equirectangular projection matching the city marker overlay.

The generated SVG is a static PWA asset and does not add map SDK or GeoJSON parsing code to the application bundle.
