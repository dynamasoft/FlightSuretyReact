import React from "react";

export default function AirlineInsurance(props) {
  
  return (
    <>
     <h2>Purchase Insurance</h2>     
     <button onClick={() => props.onClick()} >Passenger 1 Purchase Insurance from the first airline</button>
    </>
  );
}
