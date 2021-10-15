import React from "react";

export default function AirlineRegistration(props) {

  return (
    <>
      <h2>Airline Registration</h2>
      
      { props.airlines.slice(1).map((airline,index) => (      
        <div  key={'name' + index}  style={{height: 30}}>
        <input readOnly value={'airline' + (index+2) } style={{width: 50}} />
        <input readOnly key={'address' + index} value={airline}  style={{width: 320}}  />
        <button key={'btn' + index} onClick={() => props.onClick('airline'+ index, airline)} >Register</button>        
        </div>        
      ))}

    </>
  );
}
