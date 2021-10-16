import React from "react";

export default function AirlineFlight(props) {  
  return (
    <>
     <h2>Register Airline Flight ABC</h2>     
     <button onClick={() => props.onClick()} >Register Airline Flight ABC from first airline</button>
    </>
  );
}
