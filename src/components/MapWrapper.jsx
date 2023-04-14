// react
import React, { useState, useEffect, useRef } from "react";

// CSS
import "./MapWrapper.css";

// openlayers
import { Map, View, Overlay } from "ol";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM.js";
import { fromLonLat, get as getProjection, toLonLat, transform } from "ol/proj";
import { Style, Fill, Stroke } from "ol/style";
import GeoJSON from "ol/format/GeoJSON.js";
import Select from "ol/interaction/Select.js";
import { altKeyOnly, click, pointerMove } from "ol/events/condition.js";
import Feature from "ol/Feature.js";
// import arc from "arc.js";

// Arc 필요
import LineString from "ol/geom/LineString.js";

// 경북 map
// import gbMap from "../assets/sig_wsg84_gb_geo.geojson";
import gbMap from "../assets/sig_wsg84_gb_geo_arc.geojson";

function MapWrapper() {
  // set intial state
  const [map, setMap] = useState();
  const arc = require("arc"); // npm install --save arc

  // pull refs
  const mapElement = useRef();
  // const status = useRef;

  // initialize map on first render - logic formerly put into componentDidMount

  // 베이스 map (OSM: Open Street Map)
  const osmLayer = new TileLayer({ source: new OSM() });

  // 경북 map Layer - line color
  const styleMap = new Style({
    fill: new Fill({
      color: "#47de77",
    }),
  });

  // 경북 map
  const vectorLayer = new VectorLayer({
    source: new VectorSource({
      url: gbMap,
      format: new GeoJSON(),
    }),
    // background: "white",
    // style: function (feature) {
    //   const color = feature.get("COLOR") || "#d9dcfc";
    //   style.getFill().setColor(color);
    //   return style;
    // },
  });

  useEffect(() => {
    // create map
    const map = new Map({
      target: mapElement.current,
      // target: "map-wrapper",
      layers: [osmLayer, vectorLayer],
      view: new View({
        projection: "EPSG:3857",
        center: fromLonLat(
          [128.5055956, 36.5760207], //[경도, 위도] 값 설정 -> 경상북도청기준으로 설정
          getProjection("EPSG:3857")
        ),
        zoom: 7, // 초기 zoom 값
      }),
      controls: [],
      // overlays: [overlay],
    });
    let select = null; // ref to currently selected interaction

    const selected = new Style({
      fill: new Fill({
        color: "#5965cf",
      }),
      stroke: new Stroke({
        color: "rgba(255, 255, 255, 0.7)",
        width: 2,
      }),
    });

    function selectStyle(feature) {
      const color = feature.get("COLOR") || "#5965cf";
      selected.getFill().setColor(color);
      return selected;
    }

    // select interaction working on "singleclick"
    const selectSingleClick = new Select({ style: selectStyle });

    // // select interaction working on "click"
    // const selectClick = new Select({
    //   condition: click,
    //   style: selectStyle,
    // });

    // select interaction working on "pointermove"
    const selectPointerMove = new Select({
      condition: pointerMove,
      style: selectStyle,
    });

    // const selectAltClick = new Select({
    //   style: selectStyle,
    //   condition: function (mapBrowserEvent) {
    //     return click(mapBrowserEvent) && altKeyOnly(mapBrowserEvent);
    //   },
    // });
    // console.log(selectPointerMove);
    // console.log("랜더링?");
    if (selectSingleClick === null) {
      map.removeInteraction(selectSingleClick);
    } else {
      map.addInteraction(selectSingleClick);
      selectSingleClick.on("selectSingleClick", function (e) {
        // console.log(e.selected[0].values_);
        // console.log(e.selected[0].values_.SIG_KOR_NM);
        document.getElementById("status").innerHTML =
          "&nbsp;" +
          // e.target.getFeatures().getLength() +
          e.selected[0].values_.SIG_KOR_NM;
      });
    }

    map.addInteraction(selectSingleClick);
    selectSingleClick.on("selectSingleClick", function (e) {
      // console.log(e.selected[0].values_);
      // console.log(e.selected[0].values_.SIG_KOR_NM);
      console.log(e);
      // document.getElementById("status").innerHTML =
      //   "&nbsp;" +
      //   // e.target.getFeatures().getLength() +
      //   e.selected[0].values_.SIG_KOR_NM;
    });

    // console.log(selectPointerMove);
    if (selectPointerMove === null) {
      map.removeInteraction(selectPointerMove);
    } else {
      map.addInteraction(selectPointerMove);
      selectPointerMove.on("select", function (e) {
        if (e.selected.length) {
          document.getElementById("status").innerHTML =
            "&nbsp;" +
            // e.target.getFeatures().getLength() +
            e.selected[0].values_.SIG_KOR_NM;
          // console.log(e.selected[0].values_);
          // console.log(e.selected[0].values_.SIG_KOR_NM);
        }
      });
    }

    // save map and vector layer references to state
    setMap(map);
  }, []);

  // render component
  return (
    <div>
      <div id="map" ref={mapElement} className="map-container"></div>
      <span id="status">&nbsp;</span>
    </div>
  );
}

export default MapWrapper;
