import React from "react";

import { useEffect, useState, useRef } from "react";

import "antd/dist/antd.css";

import { Button, Input, Spin, Badge } from "antd";
import { Row, Col } from "antd";

import { fixControlledValue } from "antd/lib/input/Input";

import api from "../api";

import GoogleMapReact from "google-map-react";
import { func } from "prop-types";

import home from "../../images/home.png";
import target from "../../images/arrow.png";

function Maker(props) {
  return (
    <div>
      <h3 style={{ color: "red" }}>{props.text}</h3>
      <div>
        <img src={props.src} />
      </div>
    </div>
  );
}

export function MapContainer(props) {
  useEffect(() => {
    api.getLocalLatAndLng();
  }, []);

  return (
    <div style={{ marginTop: "5%" }}>
      <Map_manage />
    </div>
  );
}

//map component

function MapDisplay(props) {
  return (
    <div style={{ height: "768px", width: "1024px", marginTop: "2%" }}>
      {props.visble == true && (
        <GoogleMapReact
          bootstrapURLKeys={{ key: "AIzaSyDCGh24bypgqJqTzp04ap6vjRjSk9ICqic" }}
          defaultCenter={props.center}
          defaultZoom={15}
          zoom={props.zoom}
          center={props.center}
        >
          <Maker
            lat={props.localPos.lat}
            lng={props.localPos.lng}
            text="HOME"
            src={home}
          />
          <Maker
            lat={props.userPos.lat}
            lng={props.userPos.lng}
            text="Target"
            src={target}
          />
        </GoogleMapReact>
      )}
    </div>
  );
}

function User_Input_Display(props) {
  const refAddress = useRef(null);

  function onClick() {
    props.onClick(refAddress.current.state.value);
  }

  return (
    <div style={{ marginTop: "2%", marginLeft: "10%" }}>
      <Row>
        <Col xs={12}>
          <h3>
            Local&nbsp;Latitude:&nbsp; {props.localPos.lat}
            &nbsp;&nbsp;Longitude:&nbsp;
            {props.localPos.lng}
          </h3>
        </Col>

        <Col xs={12}>
          <h3>
            User&nbsp;Latitude:&nbsp; {props.userPos.lat}
            &nbsp;&nbsp;Longitude:&nbsp;
            {props.userPos.lng}
          </h3>
        </Col>
      </Row>
      <Row style={{ marginTop: "2%" }}>
        <Col xs={2}>
          <h3>Address</h3>
        </Col>

        <Col xs={12}>
          <Input ref={refAddress} />
        </Col>

        <Col xs={6} style={{ marginLeft: "2%" }}>
          <Button type="primary" shape="round" onClick={onClick}>
            Search
          </Button>
        </Col>
      </Row>

      <Row style={{ marginTop: "2%" }}>
        <Col xs={8}>
          <h3>TargetTime:&nbsp;{props.targetTime}</h3>
        </Col>

        <Col xs={8}>
          <h3>UTC TimeStamp:&nbsp;{props.UTCStamp}</h3>
        </Col>
      </Row>
    </div>
  );
}

var timer = null;

function Map_manage() {
  const [zoom, setZoom] = useState(20);

  const [localPos, setLocalPos] = useState({});
  const [center, setCenter] = useState({});
  const [userPos, setUserPos] = useState({ lat: 0, lng: 0 });
  const [targetTime, setTargetTime] = useState("");
  const [UTCStamp, setUTC] = useState(0);
  const [visble, setVisble] = useState(false);

  useEffect(() => {
    api.getLocalPosition().then((result) => {
      var pos = new Object();
      pos.lat = result.latitude;
      pos.lng = result.longitude;
      setLocalPos(pos);
      setCenter(pos);
      setVisble(true);
    });
  }, []);

  function onClick(address) {
    if (address == "" || address == null || address == undefined) {
      alert("address must be input");
      return;
    }

    if (timer != null && timer != undefined) {
      clearInterval(timer);
    }

    setVisble(false);
    getUserPos(address);
  }

  async function getUserPos(address) {
    var dstOffset, rawOffset;

    var pos = await api.getLatAndLng(address);
    if (pos.length == 0) {
      alert("address input err!");
    }
    setUserPos({ lat: pos[0], lng: pos[1] });
    var distance = api.getDistance(localPos.lat, localPos.lng, pos[0], pos[1]);

    console.log(distance);
    console.log(api.changeZoom(distance));

    setCenter(localPos);

    setZoom(api.changeZoom(distance));

    setVisble(true);

    //get targetTime info
    var targetInfo = await api.getTargetTimeInfoByPos(pos[0], pos[1]);

    if (targetInfo.length > 0) {
      dstOffset = targetInfo[0];
      rawOffset = targetInfo[1];

      //get user targetTime

      timer = setInterval(() => {
        setTargetTime(api.getTargetTime(dstOffset, rawOffset));
        setUTC(api.getUTCTimeStamp());
      }, 500);
    }
  }

  return (
    <div>
      <User_Input_Display
        localPos={localPos}
        userPos={userPos}
        onClick={onClick}
        targetTime={targetTime}
        UTCStamp={UTCStamp}
      />
      <div style={{ marginLeft: "10%" }}>
        <MapDisplay
          zoom={zoom}
          center={center}
          localPos={localPos}
          userPos={userPos}
          visble={visble}
        />
      </div>
    </div>
  );
}
