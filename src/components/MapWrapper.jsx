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
import centroidData from "../assets/centroid_gb.json";

function MapWrapper() {
  // set intial state
  const [map, setMap] = useState();
  const [selectedRegion, selectRegion] = useState(null);

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
    autoHighlighte: true,
    onClick: ({ object }) => {
      selectRegion(object);
    },
    // background: "white",
    // style: function (feature) {
    //   const color = feature.get("COLOR") || "#d9dcfc";
    //   style.getFill().setColor(color);
    //   return style;
    // },
  });

  console.log(centroidData.features[0].properties.SIG_CD);
  console.log(selectedRegion);

  const flightsSource = new VectorSource({
    loader: function () {
      const flightsData = centroidData.features;
      for (let i = 0; i < flightsData.length; i++) {
        const flight = flightsData[i];
        const from = flight[0];
        const to = flight[1];

        // create an arc circle between the two locations
        const arcGenerator = new arc.GreatCircle(
          { x: from[1], y: from[0] },
          { x: to[1], y: to[0] }
        );

        const arcLine = arcGenerator.Arc(100, { offset: 10 });
        // paths which cross the -180°/+180° meridian are split
        // into two sections which will be animated sequentially
        const features = [];
        arcLine.geometries.forEach(function (geometry) {
          const line = new LineString(geometry.coords);
          line.transform("EPSG:4326", "EPSG:3857");

          features.push(
            new Feature({
              geometry: line,
              finished: false,
            })
          );
        });
        // add the features with a delay so that the animation
        // for all features does not start at the same time
        map.addLater(features, i * 50);
      }
      // TileLayer.on('postrender', animateFlights);
    },
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
    // if (selectSingleClick === null) {
    //   map.removeInteraction(selectSingleClick);
    // } else {
    //   map.addInteraction(selectSingleClick);
    //   selectSingleClick.on("select", function (e) {
    //     // selectRegion(e.selected[0]);
    //     console.log(e);

    //     // console.log(selectedRegion);
    //     // console.log(e.selected[0].values_);
    //     // console.log(e.selected[0].values_.SIG_KOR_NM);
    //     document.getElementById("status").innerHTML =
    //       "&nbsp;" +
    //       // e.target.getFeatures().getLength() +
    //       e.selected[0].values_.SIG_KOR_NM;
    //   });
    // }
    // console.log(selectedRegion);

    // 클릭시 event
    map.addInteraction(selectSingleClick);
    // selectSingleClick.on("selectSingleClick", function (e) {
    selectSingleClick.on("select", function (e) {
      if (e.selected.length > 0) {
        console.log(e.selected[0].values_);
        document.getElementById("status").innerHTML =
          "&nbsp;" +
          // e.target.getFeatures().getLength() +
          e.selected[0].values_.SIG_KOR_NM;
      }
      // console.log(e.selected[0].values_);
      // console.log(e.selected[0].values_.SIG_KOR_NM);
    });

    // console.log(selectPointerMove);
    if (selectPointerMove === null) {
      map.removeInteraction(selectPointerMove);
    } else {
      map.addInteraction(selectPointerMove);
      selectPointerMove.on("select", function (e) {
        // 여기에 hover시 팝업 기능 넣으면 될 것 같음
        // Div하나 만들어서 클릭 위치 바로 위에 생성 후 hover 풀리면 바로 삭제
        // if (e.selected.length) {
        //   document.getElementById("status").innerHTML =
        //     "&nbsp;" +
        //     // e.target.getFeatures().getLength() +
        //     e.selected[0].values_.SIG_KOR_NM;
        //   // console.log(e.selected[0].values_);
        //   // console.log(e.selected[0].values_.SIG_KOR_NM);
        // }
      });
    }
    // console.log(selectedRegion);
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
