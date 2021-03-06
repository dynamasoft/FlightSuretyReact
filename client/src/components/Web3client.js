import FlightSuretyApp from  "../config/FlightSuretyApp.json";
import FlightSuretyData from "../config/FlightSuretyData.json";
import Config from "../config/config.json";
import Web3 from "web3";
import Web3Util from "web3-utils";

export default class Contract {

  constructor(network, callback) {    
    this.AIRLINE_FEE = Web3Util.toWei("10", "ether");
    this.INSURANCE_FEE = Web3Util.toWei("1", "ether");
    this.TIMESTAMP = Math.floor(Date.now() / 1000);

    this.config = Config[network];
    this.web3 = new Web3(new Web3.providers.HttpProvider(this.config.url));
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      this.config.appAddress
    );
    this.flightSuretyData = new this.web3.eth.Contract(
      FlightSuretyData.abi,
      this.config.dataAddress
    );
    this.initialize(callback);
    this.owner = null;
    this.firstAirline = null;
    this.airlines= [];
    this.passengers = [];

    this.flight = "ABC";
    this.flightFrom = "Denver";
    this.flightTo = "Florida";
  }

  initialize(callback) {
    
    this.web3.eth.getAccounts((error, accts) => {
      this.owner = accts[0];

      let counter = 1;

      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++], );
      }

      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }
      callback();

      this.flightSuretyData.methods
        .authorizeContract(this.config.appAddress)
        .send({ from: this.owner });
    });
  }

  getAirlines()
  {    
    return this.airlines;
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback);
  }

  getFirstRegisteredAirline(callback) {
    let self = this;
    self.flightSuretyData.methods
      .getRegisteredAirlines()
      .call()
      .then((value) => {
        this.firstAirline = value[0];
        callback(value[0]);
      })
      .catch((error) => {
        alert(error);
      });
  }

  async registerAirline(name, address, callback) {
    try {
      let self = this;
      var result = await self.flightSuretyApp.methods
        .registerAirline(name, address)
        .send({
          from: this.firstAirline,
          gas: 4712388,
          gasPrice: 100000000000,
        });

      result = await self.flightSuretyData.methods
        .isRegisteredAirline(address)
        .call();

      if (result) {
        callback("airline has been registered successfully.");
      } else {
        callback("airline has not been registered.");
      }
    } catch (e) {
      
      callback(e.message);
    }
  }

  payAirline(address, callback) {
    let self = this;
    var result = self.flightSuretyApp.methods
      .payAirline()
      .send({ from: this.firstAirline, value: this.AIRLINE_FEE })
      .then(function (result) {
        callback(result);
      });
  }

  async registerFlight(callback) {
    
    try {
      let self = this;

      var result = await self.flightSuretyApp.methods
        .registerFlight(
          this.flight,
          this.flightFrom,
          this.flightTo,
          this.TIMESTAMP
        )
        .send({
          from: this.firstAirline,
          gas: 4712388,
          gasPrice: 100000000000,
        });

      
      result = await self.flightSuretyApp.methods
        .isRegisteredFlight(this.firstAirline, this.flight, this.TIMESTAMP)
        .call();
      
      if (result) {
        callback("Flight has been successfully registered : ");
      } else {
        callback("Flight registration is not successful");
      }
    } catch (e) {
      
      callback(e.message);
    }
  }

  flightStatusInfo(callback)
  {
    let self = this;
    debugger;
    self.flightSuretyApp.events.FlightStatusInfo({}, function(error, event) {
      debugger;
        if(error) {
            console.log(error);
        } else {
            //console.log(event.returnValues);
            callback(event.returnValues);
        }
    });

    self.flightSuretyApp.events.OracleReport({}, function(error, event) {
      debugger;
        if(error) {
            console.log(error);
        } else {
            //console.log(event.returnValues);
            callback(event.returnValues);
        }
    })
  }

  async purchaseInsurance(callback) {
    
    try {
      let self = this;
      var result = await self.flightSuretyApp.methods
        .purchaseInsurance(this.firstAirline, this.flight, this.TIMESTAMP)
        .send({ 
          from: this.passengers[0], 
          value: this.INSURANCE_FEE,
          gas: 4712388,
          gasPrice: 100000000000,
        });
        
        
        callback("Flight Insurance purchased");

    } 
    catch (e) {
      
      callback(e.message);
    }
  }

  fetchFlightStatus(flight, callback) {
    debugger;
    let self = this;
    let payload = {
      airline: self.airlines[0],
      flight: flight,
      timestamp: Math.floor(Date.now() / 1000),
    };
    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.owner }, (error, result) => {
        debugger;
        if(error == null)
        {
          callback("oracle callback has been dispatched")
        }
        else
        {
          callback(error.message);
        }
       
      });
  }
  
  async pendingPaymentAmount(callback) {
    
    try {      
      debugger;
      let self = this;
      var result = await self.flightSuretyApp.methods
        .getPendingPaymentAmount(this.passengers[0]).call();
        callback("Pending payment amount: " + result);

        debugger;
       result = await self.flightSuretyApp.methods.getPendingPaymentAmount(this.passengers[0]);
    } 
    catch (e) {      
      callback(e.message);
    }
  }
  
  async getPassengerBalance(callback) {    
    try {
      
      var result = await this.web3.eth.getBalance(this.passengers[0]);
      callback("passenger 1 balance: " + result);

    } 
    catch (e) {      
      callback(e.message);
    }
  }  
  
  async refund(callback) {    
    try {      
      debugger;
      let self = this;
      await self.flightSuretyApp.methods.refund()
      .send({from:this.passengers[0]});
    } 
    catch (e) {      
      callback(e.message);
    }
  }
}
