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
import { Style, Fill, Stroke, Icon } from "ol/style";
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
import arrowSVG from "../assets/arrow.svg";

function MapWrapper() {
  // set intial state
  const [map, setMap] = useState();
  const [selectedRegion, selectRegion] = useState(null);

  const arc = require("arc"); // npm install --save arc

  // pull refs
  const mapElement = useRef();

  // initialize map on first render - logic formerly put into componentDidMount

  // 베이스 map 선언 (OSM: Open Street Map)
  const osmLayer = new TileLayer({ source: new OSM() });

  // 경북 지도 Style 정의 map Layer - line color
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
    // background: "white",
    // style: function (feature) {
    //   const color = feature.get("COLOR") || "#d9dcfc";
    //   style.getFill().setColor(color);
    //   return style;
    // },
  });

  var arcStyle = new Style({
    stroke: new Stroke({
      color: "rgba(164, 10, 207 ,1)",
      width: 2,
    }),
  });

  var arcSource = new VectorSource();

  var arcLayer = new VectorLayer({
    source: arcSource,
    style: function (feature) {
      //스타일을 줘버리면 첨부터 그려진상태로 진행된다.
      return arcStyle; //디버그 의미로 한번 줘 보자
    },
  });

  function makeArcLine(selectedRegion) {
    arcSource.clear(); // arc를 모두 그리고 새로 그릴 때 초기화 시켜줌

    let arcData = selectedRegion;
    // console.log(arcData);
    if (arcData === null) {
      console.log("null이라고 하네용");
    } else {
      // let arcData = selectedRegion;
      // console.log(arcData.target);
      const from = arcData.centroid;

      for (const i in arcData.target) {
        // to의 도시 코드를 찾는다.
        const targetCode = arcData.target[i];
        const findTo = centroidData.features.find(
          (obj) => parseInt(obj.properties.SIG_CD) === targetCode
        );
        const to = findTo.properties.centroid;
        // console.log(from);
        // console.log(to);
        const arcGenerator = new arc.GreatCircle( //이건 구조체를 그리는데 도움을 주는 라이브러리
          { x: from[0], y: from[1] },
          { x: to[0], y: to[1] }
        );

        const arcLine = arcGenerator.Arc(100, { offset: 50 }); //라인이 그려진다.

        if (arcLine.geometries.length === 1) {
          // console.log("여기까지 들어오나?");
          // console.log(arcLine.geometries[0].coords);
          const line = new LineString(arcLine.geometries[0].coords); //LineString 객체를 통해 맵에서 사용 가능한 형태로 조립하고
          // console.log(line);
          line.transform("EPSG:4326", "EPSG:3857");
          const feature = new Feature({
            //구조물을 만들어
            geometry: line,
          });
          // feature.set("startTime", new Date().getTime()); //해당 값은 이벤트의 시작 종료를 위해 필요 하다.
          // feature.set("myIndex", i);

          // 화살표 스타일 지정
          const dx = to.x - from.x;
          const dy = to.y - from.y - 20;
          const rotation = Math.atan2(dy, dx);
          const lineStyles = [
            // linestring
            new Style({
              stroke: new Stroke({
                color: "#ffcc33",
                width: 4,
              }),
            }),
            new Style({
              geometry: line,
              image: new Icon({
                src: arrowSVG,
                anchor: [0.75, 0.5],
                rotateWithView: false,
                rotation: -rotation,
              }),
            }),
          ];

          feature.setStyle(lineStyles); // arrow style 추가해준다.

          arcSource.addFeature(feature); //벡터레이어가 참조하는 백터소스에 추가하여준다.
        }
      }
    }
  }

  useEffect(() => {
    const container = document.getElementById("popup");
    const content = document.getElementById("popup-content");
    const closer = document.getElementById("popup-closer");

    // 클릭시 팝업 Overlay
    const overlay = new Overlay({
      element: container,
      // autoPan: {
      //   animation: {
      //     duration: 250,
      //   },
      // },
    });

    // closer.onclick = function () {
    //   overlay.setPosition(undefined);
    //   closer.blur();
    //   return false;
    // };

    // create map
    const map = new Map({
      target: mapElement.current,
      // target: "map-wrapper",
      layers: [osmLayer, vectorLayer, arcLayer],
      view: new View({
        projection: "EPSG:3857",
        center: fromLonLat(
          [128.5055956, 36.5760207], //[경도, 위도] 값 설정 -> 경상북도청기준으로 설정
          getProjection("EPSG:3857")
        ),
        zoom: 7, // 초기 zoom 값
      }),
      overlays: [overlay],
      controls: [],
    });
    let select = null; // ref to currently selected interaction

    // 지역을 선택했을 때의 Style 정의
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

    // 클릭시 event
    map.addInteraction(selectSingleClick);
    selectSingleClick.on("select", function (e) {
      // 지도가 아닌 곳을 눌렀을 경우
      if (e.selected.length === 0) {
        selectRegion(null); // 지역 선택 초기화
        arcSource.clear(); // arc 초기화
        overlay.setPosition(undefined); // 팝업 좌표 초기화
      } else {
        // 지도 레이어를 클릭했을 경우
        // selectRegion(e.selected[0].values_);
        makeArcLine(e.selected[0].values_); // arc를 그리는 함수 실행
        document.getElementById("status").innerHTML =
          "&nbsp;" +
          // e.target.getFeatures().getLength() +
          e.selected[0].values_.SIG_KOR_NM;
        content.innerHTML = `<p>${e.selected[0].values_.SIG_KOR_NM}</p>`;
        const coordinate = e.selected[0].values_.centroid;

        console.log(coordinate);
        overlay.setPosition(coordinate);
      }
      // console.log(e.selected[0].values_.centroid);
      // const coordinate = [e.selected[0].values_.centroid[0], e.selected[0].values_.centroid[1]];

      // console.log(e.selected[0].values_.SIG_KOR_NM);
    });
    // makeArcLine(selectedRegion);

    // console.log(selectedRegion);
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
      <div id="popup" className="ol-popup">
        <div id="popup-content"></div>
      </div>
    </div>
  );
}

export default MapWrapper;
