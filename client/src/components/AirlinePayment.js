import React from "react";

export default function AirlinePayment(props) {
  return (
    <>
      <h2>Airline Payment</h2>
      <div>
        First Register airline : {props.firstAirlineAddress}
        <br />
        <button onClick={() => props.onClick()}>
          Pay to participate
        </button>
      </div>
    </>
  );
}
