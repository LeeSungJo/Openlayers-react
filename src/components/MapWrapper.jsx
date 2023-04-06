// react
import React, { useState, useEffect, useRef } from "react";

// CSS
import "./MapWrapper.css";

// openlayers
import { Map, View, Overlay } from "ol";
// import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
// import { transform } from "ol/proj";
// import { toStringXY } from "ol/coordinate";

import OSM from "ol/source/OSM.js";
import { fromLonLat, get as getProjection, toLonLat, transform } from "ol/proj";
import GeoJSON from "ol/format/GeoJSON.js";
// import { toLonLat } from "ol/proj.js";
import { toStringHDMS } from "ol/coordinate.js";

// 경북 map
import gbMap from "../assets/sig_wsg84_gb_geo.geojson";

function MapWrapper() {
  // set intial state
  const [map, setMap] = useState();
  // const [featuresLayer, setFeaturesLayer] = useState();
  const [selectedCoord, setSelectedCoord] = useState();

  // pull refs
  const mapElement = useRef();
  const container = document.getElementById("popup");
  const content = document.getElementById("popup-content");
  const closer = document.getElementById("popup-closer");

  // create state ref that can be accessed in OpenLayers onclick callback function
  //  https://stackoverflow.com/a/60643670
  const mapRef = useRef();
  mapRef.current = map;

  // initialize map on first render - logic formerly put into componentDidMount
  useEffect(() => {
    // base map (OSM: Open Street Map)
    const osmLayer = new TileLayer({ source: new OSM() });

    // 경북 map
    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        url: gbMap,
        format: new GeoJSON(),
      }),
      // background: "white",
      // style: function (feature) {
      //   const color = feature.get("COLOR") || "#eeeeee";
      //   style.getFill().setColor(color);
      //   return style;
      // },
    });

    // 클릭시 popup
    const overlay = new Overlay({
      element: container,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
    });

    // create map
    const initialMap = new Map({
      target: mapElement.current,
      layers: [osmLayer, vectorLayer],
      view: new View({
        projection: "EPSG:3857",
        center: fromLonLat(
          [128.5055956, 36.5760207], //[경도, 위도] 값 설정 -> 경상북도청기준으로 설정
          getProjection("EPSG:3857")
        ),
        zoom: 7,
      }),
      controls: [],
      overlays: [overlay],
    });

    // set map onclick handler
    initialMap.on("click", handleMapClick);

    // Add a click handler to hide the popup.
    // @return {boolean} Don't follow the href.

    closer.onclick = function () {
      overlay.setPosition(undefined);
      closer.blur();
      return false;
    };

    initialMap.on("singleclick", function (evt) {
      const coordinate = evt.coordinate;
      const hdms = toStringHDMS(toLonLat(coordinate));

      content.innerHTML = "<p>You clicked here:</p><code>" + hdms + "</code>";
      overlay.setPosition(coordinate);
    });

    // save map and vector layer references to state
    setMap(initialMap);
  }, []);

  // update map if features prop changes - logic formerly put into componentDidUpdate
  // useEffect(() => {
  //   if (props.features.length) {
  //     // may be null on first render

  //     // set features to map
  //     featuresLayer.setSource(
  //       new VectorSource({
  //         features: props.features, // make sure features is an array
  //       })
  //     );

  //     // fit map to feature extent (with 100px of padding)
  //     map.getView().fit(featuresLayer.getSource().getExtent(), {
  //       padding: [100, 100, 100, 100],
  //     });
  //   }
  // }, [props.features]);

  // map click handler
  const handleMapClick = (event) => {
    // get clicked coordinate using mapRef to access current React state inside OpenLayers callback
    //  https://stackoverflow.com/a/60643670
    const clickedCoord = mapRef.current.getCoordinateFromPixel(event.pixel);

    // transform coord to EPSG 4326 standard Lat Long
    const transormedCoord = transform(clickedCoord, "EPSG:3857", "EPSG:4326");

    // set React state
    setSelectedCoord(transormedCoord);
  };

  // render component
  return (
    <div>
      <div ref={mapElement} className="map-container"></div>
      <div id="popup" className="ol-popup">
        {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
        <a href="/" id="popup-closer" className="ol-popup-closer"></a>
        <div id="popup-content"></div>
      </div>
      {/* <div className="clicked-coord-label">
        <p>{selectedCoord ? toStringXY(selectedCoord, 5) : ""}</p>
      </div> */}
    </div>
  );
}

export default MapWrapper;
