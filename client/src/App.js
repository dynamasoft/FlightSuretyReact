import React, { useState, useEffect } from "react";
import { Container, AppBar, Typography, Grow, Grid } from "@material-ui/core";
import Contract from "./components/Web3client";
import AirlinePayment from "./components/AirlinePayment";
import AirlineRegistration from "./components/AirlineRegistration";
import AirlineInsurance from "./components/AirlineInsurance";
import AirlineOracle from "./components/AirlineOracle";
import AirlineFlight from "./components/AirlineFlight";

const App = () => {
  //init();
  const [firstAirlineAddress, setFirstAirlineAddress] =
    useState("Empty Address");
  const [contract, setContract] = useState();
  const [logs, setLogs] = useState([]);
  const [airlines, setAirlines] = useState([]);

  useEffect(() => {
    // Run! Like go get some data from an API.
    let resultContract = new Contract("localhost", () => {
      // Read transaction
      setContract(resultContract);
      resultContract.isOperational((error, result) => {
        console.log(error, result);
      });

      resultContract.getFirstRegisteredAirline((address) => {
        setFirstAirlineAddress(address);
      });
      setAirlines(resultContract.getAirlines());

      resultContract.flightStatusInfo(response =>
        {
          debugger;
          displayMessage(response);
        });

    });


    

  }, []);


  const updateStatus = (obj) =>
  {
    displayMessage("flight status updated");
  }

  const payToParticipate = () => {
    
    contract.payAirline(firstAirlineAddress, (response) => {
      displayMessage("funding an airline is successful " + response);
    });
  };  

  const registerAirline = (name, address) => {
        contract.registerAirline(name, address, (response) => {
      
      displayMessage(response);
    });
  };

  const purchaseInsurance = () => {
    
    contract.purchaseInsurance((response) => {
      
      displayMessage(response);
    });
  };

  const registerFlight = () => {
    
    contract.registerFlight((response) => {
      displayMessage(response);
    });
  }

  const fetchFlightStatus = (flight) => {
    
    contract.fetchFlightStatus(flight, (response) => {
      displayMessage(response);
    });
  }  

  const getPendingAmount = () =>
  {
  
    debugger;
    contract.pendingPaymentAmount(response => {
      debugger;
      displayMessage(response);
    });    
  }

  const getPassengerBalance = () =>
  {  
    debugger;
    contract.getPassengerBalance(response => {
      debugger;
      displayMessage(response);
    });    
  }

  const refund = () =>
  {
  
    debugger;
    contract.refund(response => {
      debugger;
      displayMessage(response);
    });    
  }



  function displayMessage(msg) {
    
    setLogs((logs) => [...logs, msg]);
  }

  return (
    <Grid container>
      <Grid item xs={6}>
        <AirlinePayment firstAirlineAddress={firstAirlineAddress} onClick={() => payToParticipate()}/>
        <AirlineRegistration airlines={airlines} onClick={(name, address) => registerAirline(name, address)}/>
        <AirlineFlight onClick={() => registerFlight() } />
        <AirlineInsurance onClick={() => purchaseInsurance() } />
        <AirlineOracle onClick={(flight) => fetchFlightStatus(flight)} />
        
        <h2>Get Pending Payment Amount</h2>
        <button id="pendingPaymentAmountBtn" onClick={() => getPendingAmount() } > Check the amount to be Refund</button>
        <br />
        <h2>Passenger Balance</h2>
        <button id="getPassengerBalanceBtn" onClick={() => getPassengerBalance() } >Get Passenger Balance</button>
        <br />
        <h2>Purchase Insurance</h2>
        <button id="withdrawPaymentBtn" onClick={() => refund() } >Get Refund</button>
      </Grid>
      <Grid item xs={6}>
        <h2>LOGS</h2>
        {logs.map((log) => (
          <div key="2">{log}</div>
        ))}
      </Grid>
    </Grid>
  );
};

export default App;
