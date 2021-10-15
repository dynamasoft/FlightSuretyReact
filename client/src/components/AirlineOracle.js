import React, { useState } from "react";

export default function AirlineOracle(props) {
  
  const [flightNumber, setFlightNumber] = useState("1234");
  
  return (
    <>
     <h2>Send to Oracle Insurance</h2>
     <input id="flightNumber" type="text" value={flightNumber} onChange={(value)=> setFlightNumber(value)} />
     <button onClick={() => props.onClick(flightNumber)} >Submit To Oracle</button>
    </>
  );
}
