import React, { useState, useEffect } from 'react';
import { Container, AppBar, Typography, Grow, Grid } from '@material-ui/core';
import useStyles from './styles';
import memories from './images/memories.png';
import { } from './components/Web3/Web3client';



const App = () => {  

  debugger;
  //init();

const payToParticipate = () => {
  
  debugger;


}

  return (
    <div className="container">
    <div className="row">
      <div className="col-8">
        <h2>Airline Registration</h2>        
        <div>
            First Register airline :
            <span id="firstRegisteredAirlineAddress"></span>
            <button id="payBtn" onClick={() => payToParticipate()}>Pay to participate</button>
          </div>

      </div>
      <div className="col-4">
          <h2>LOGS</h2>
        <div id="msg"></div>
      </div>
    </div>
  </div>
  );
};

export default App;
