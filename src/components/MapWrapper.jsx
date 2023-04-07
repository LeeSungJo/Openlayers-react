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
import { Style, Fill, Stroke } from "ol/style";
import GeoJSON from "ol/format/GeoJSON.js";
// import { toLonLat } from "ol/proj.js";
import Select from "ol/interaction/Select.js";
import { altKeyOnly, click, pointerMove } from "ol/events/condition.js";

// 경북 map
import gbMap from "../assets/sig_wsg84_gb_geo.geojson";

function MapWrapper() {
  // set intial state
  const [map, setMap] = useState();

  // pull refs
  const mapElement = useRef();
  // const status = useRef;

  // initialize map on first render - logic formerly put into componentDidMount

  // 베이스 map (OSM: Open Street Map)
  const osmLayer = new TileLayer({ source: new OSM() });

  // 경북 map Layer - line color
  const style = new Style({
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

    // select interaction working on "click"
    const selectClick = new Select({
      condition: click,
      style: selectStyle,
    });

    // select interaction working on "pointermove"
    const selectPointerMove = new Select({
      condition: pointerMove,
      style: selectStyle,
    });

    const selectAltClick = new Select({
      style: selectStyle,
      condition: function (mapBrowserEvent) {
        return click(mapBrowserEvent) && altKeyOnly(mapBrowserEvent);
      },
    });

    // const selectElement = document.getElementById("type");

    // const changeInteraction = function () {
    //   if (select !== null) {
    //     map.removeInteraction(select);
    //   }
    //   const value = selectElement.value;

    // select = selectSingleClick;

    // if (value == "singleclick") {
    //   select = selectSingleClick;
    // } else if (value == "click") {
    //   select = selectClick;
    // } else if (value == "pointermove") {
    //   select = selectPointerMove;
    // } else if (value == "altclick") {
    //   select = selectAltClick;
    // } else {
    //   select = null;
    // }
    if (selectSingleClick === null) {
      map.removeInteraction(selectSingleClick);
    } else {
      map.addInteraction(selectSingleClick);
      selectSingleClick.on("select", function (e) {
        console.log(e.selected[0].values_);
        console.log(e.selected[0].values_.SIG_KOR_NM);
        document.getElementById("status").innerHTML =
          "&nbsp;" +
          // e.target.getFeatures().getLength() +
          e.selected[0].values_.SIG_KOR_NM;
      });
    }

    // if (selectSingleClick !== null) {
    //   map.addInteraction(selectSingleClick);
    //   selectSingleClick.on("select", function (e) {
    //     console.log(e.selected[0].values_);
    //     console.log(e.selected[0].values_.SIG_KOR_NM);
    //     document.getElementById("status").innerHTML =
    //       "&nbsp;" +
    //       // e.target.getFeatures().getLength() +
    //       e.selected[0].values_.SIG_KOR_NM;
    //   });
    // }

    if (selectPointerMove === null) {
      map.removeInteraction(selectPointerMove);
    } else {
      map.addInteraction(selectPointerMove);
      selectPointerMove.on("select", function (e) {
        console.log(e.selected[0].values_);
        console.log(e.selected[0].values_.SIG_KOR_NM);
        document.getElementById("status").innerHTML =
          "&nbsp;" +
          // e.target.getFeatures().getLength() +
          e.selected[0].values_.SIG_KOR_NM;
      });
    }

    // if (selectPointerMove !== null) {
    //   map.addInteraction(selectPointerMove);
    //   selectPointerMove.on("select", function (e) {
    //     console.log(e.selected[0].values_);
    //     console.log(e.selected[0].values_.SIG_KOR_NM);
    //     document.getElementById("status").innerHTML =
    //       "&nbsp;" +
    //       // e.target.getFeatures().getLength() +
    //       e.selected[0].values_.SIG_KOR_NM;
    //   });
    // }

    // if (select !== null) {
    //   map.addInteraction(select);
    //   select.on("select", function (e) {
    //     console.log(e.selected[0].values_);
    //     console.log(e.selected[0].values_.SIG_KOR_NM);
    //     document.getElementById("status").innerHTML =
    //       "&nbsp;" +
    //       // e.target.getFeatures().getLength() +
    //       e.selected[0].values_.SIG_KOR_NM;
    //   });
    // }

    // };

    // ------------------------------------------------------------------------
    // // hover시 스타일 지정
    // const selectStyle = new Style({
    //   fill: new Fill({
    //     color: "#eeeeee",
    //   }),
    //   stroke: new Stroke({
    //     color: "rgba(255, 255, 255, 0.7)",
    //     width: 2,
    //   }),
    // });

    // const status = document.getElementById("status");

    // let selected = null;
    // map.on("pointermove", function (e) {
    //   console.log(e.target.value_);
    //   if (selected !== null) {
    //     selected.setStyle(undefined);
    //     selected = null;
    //   }

    //   map.forEachFeatureAtPixel(e.pixel, function (f) {
    //     selected = f;
    //     selectStyle.getFill().setColor(f.get("COLOR") || "#1e57b3");
    //     f.setStyle(selectStyle);
    //     return true;
    //   });

    //   if (selected) {
    //     status.innerHTML = selected.get("SIG_KOR_NM");
    //   } else {
    //     status.innerHTML = "&nbsp;";
    //   }
    // });
    // ----------------------------------------------------------------------------
    // const highlightStyle = new Style({
    //   stroke: new Stroke({
    //     color: "rgba(255, 255, 255, 0.7)",
    //     width: 2,
    //   }),
    // });

    // const featureOverlay = new VectorLayer({
    //   source: new VectorSource(),
    //   map: map,
    //   style: highlightStyle,
    // });

    // // 오픈레이어스 hover 예시
    // const selectStyle = new Style({
    //   fill: new Fill({
    //     color: "#eeeeee",
    //   }),
    //   stroke: new Stroke({
    //     color: "rgba(255, 255, 255, 0.7)",
    //     width: 2,
    //   }),
    // });

    // let highlight;
    // const displayFeatureInfo = function (pixel) {
    //   vectorLayer.getFeatures(pixel).then(function (features) {
    //     // console.log(features[0].values_);
    //     const feature = features.length ? features[0].values_ : undefined;

    //     // const info = document.getElementById("info");
    //     // if (features.length) {
    //     //   info.innerHTML =
    //     //     feature.get("ECO_NAME") + ": " + feature.get("NNH_NAME");
    //     // } else {
    //     //   info.innerHTML = "&nbsp;";

    //     const status = document.getElementById("status");

    //     let selected = null;
    //     map.on("pointermove", function (e) {
    //       if (selected !== null) {
    //         selected.setStyle(undefined);
    //         selected = null;
    //       }

    //       map.forEachFeatureAtPixel(e.pixel, function (f) {
    //         selected = f;
    //         selectStyle.getFill().setColor(f.get("COLOR") || "#4287f5");
    //         f.setStyle(selectStyle);
    //         return true;
    //       });

    //       if (selected) {
    //         status.innerHTML = selected.get("SIG_KOR_NM");
    //       } else {
    //         status.innerHTML = "&nbsp;";
    //       }
    //     });
    //     if (feature !== highlight) {
    //       if (highlight) {
    //         featureOverlay.getSource().removeFeature(highlight);
    //       }
    //       if (feature) {
    //         featureOverlay.getSource().addFeature(feature);
    //       }
    //       highlight = feature;
    //     }
    //   });
    // };

    // // 마우스 hover시 반응
    // map.on("pointermove", function (evt) {
    //   console.log(evt);
    //   if (evt.dragging) {
    //     return;
    //   }
    //   const pixel = map.getEventPixel(evt.originalEvent);
    //   displayFeatureInfo(pixel);
    // });

    // // 마우스 hover시 반응
    // map.on("pointermove", function (evt) {
    //   if (evt.dragging) {
    //     return;
    //   }
    //   const pixel = map.getEventPixel(evt.originalEvent);
    //   displayFeatureInfo(pixel);
    // });

    // // 마우스 클릭시 반응
    // map.on("click", function (evt) {
    //   displayFeatureInfo(evt.pixel);
    // });

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
