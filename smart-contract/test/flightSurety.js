var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {
  const TIMESTAMP = Math.floor(Date.now() / 1000);
  // Airlines information
  var airline2 = accounts[2];
    var flight1 = {
    airline: airline2,
    flight: "1234", 
    from: "AAA",
    to: "BBB", 
    timestamp: TIMESTAMP
  }
      var flight2 = {
    airline: airline2,
    flight: "5678", 
    from: "CCC",
    to: "DDD", 
    timestamp: TIMESTAMP
  }
  
  var airline3 = accounts[3];
  var flight3 = {
    airline: airline3,
    flight: "3333", 
    from: "EEE",
    to: "FFF", 
    timestamp: TIMESTAMP
  }
  var airline4 = accounts[4];
    var flight4 = {
    airline: airline4,
    flight: "5533",
    from: "GGG",
    to: "SSS",
    timestamp: TIMESTAMP
  }
  
  var airline5 = accounts[5];
  var airline6 = accounts[6];

  // Passengers information
  var passenger1 = accounts[10];
  var passenger2 = accounts[11];

  //constant variables
  
 
  const AIRLINE_FEE = web3.utils.toWei("10", "ether");
  const PASSENGER_INSUR_VALUE_1 = web3.utils.toWei("1", "ether");
  const PASSENGER_INSUR_VALUE_2 = web3.utils.toWei("0.5", "ether");
  var config;
  
  before('setup contract', async () => {

    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address);

  });

  describe('(multiparty) - contract test operational functionality', function() {

    it(`(multiparty) has correct initial isOperational() value`, async function () {
      // Get operating status
      var status = await config.flightSuretyData.isOperational.call();
      assert.equal(status, true, "Incorrect initial operating status value");
    });

    it(`(multiparty) - can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
      // Ensure that access is denied for non-Contract Owner account
      var accessDenied = false;
      try {
        await config.flightSuretyData.setOperatingStatus(false, {from: config.testAddresses[2]});
      }
      catch(error) {
        //console.log(error);
        accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
    });

    it(`(multiparty) - can allow access to setOperatingStatus() for Contract Owner account`, async function () {
      // Ensure that access is allowed for Contract Owner account
      var accessDenied = false;
      try {
        await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(error) {
        //console.log(error);
        accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);
    });

    it(`(multiparty) - can block access to functions using requireIsOperational when operating status is false`, async function () {
      await config.flightSuretyData.setOperatingStatus(false);

      var cancelled = false;
      try {
        await config.flightSurety.isOperational(true);
      }
      catch(error) {
        //console.log(error);
        cancelled = true;
      }
      assert.equal(cancelled, true, "Access not blocked for requireIsOperational");

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);
    });
  });

  describe('(airline) - test airline functionality', function() {
    
    it('(airline) first airline is registered when contract is deployed', async () => 
    {
      var airlineName = await config.flightSuretyData.getAirlineName(config.firstAirlineAddress, {from: config.owner});      
      assert.equal(airlineName, config.firstAirlineName, "First airline has not been registered")
    });
  
    it('(airline) - cannot participate if it has not paid to participate', async () => {
      try {
        await config.flightSuretyApp.registerAirline("Southwest", airline2, {from: config.firstAirlineAddress});
      }
      catch(error) {
        //console.log(error);
      }
      var result = await config.flightSuretyData.isRegisteredAirline.call(airline2); 

      assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
    });
    
    
    it('(airline) - airline pays incorrect fee to participate', async () => {
      
      const incorectFee = web3.utils.toWei("3", "ether");

      var cancelled = false;
      try {
        await config.flightSuretyApp.payAirline({from: config.firstAirlineAddress, value: incorectFee})
      }
      catch(error) {
        //console.log(error);
        cancelled = true;
      }

      assert.equal(cancelled, true, "Airline should not have been able to participate with less than 10 ether");
    });  

    
    it('(airline) - airline does participate in contract the fee has been paid', async () => {
      await config.flightSuretyApp.payAirline({from: config.firstAirlineAddress, value: AIRLINE_FEE, gasPrice: 0})

      try {
        await config.flightSuretyApp.registerAirline("Southwest", airline2, {from: config.firstAirlineAddress});
      }
      catch(error) {
        console.log(error);
      }
      var result = await config.flightSuretyData.isRegisteredAirline.call(airline2); 

      assert.equal(result, true, "Airline can register another airline if it has paid to participate");
    });      

    
    it('(airline) - can register up to 4 airlines', async () => {
      var result = undefined;

      try {
        await config.flightSuretyApp.registerAirline("EVA Air", airline3, {from: config.firstAirlineAddress});
      }
      catch(error) {
        console.log(error);
      }

      result = await config.flightSuretyData.isRegisteredAirline.call(airline3);
      assert.equal(result, true, "Registering the third airline should be possible");

      
      try {
        await config.flightSuretyApp.registerAirline("Holy Airlines", airline4, {from: config.firstAirlineAddress});
      }
      catch(error) {
        console.log(error);
      }
      result = await config.flightSuretyData.isRegisteredAirline.call(airline4);
      assert.equal(result, true, "Registering the fourth airline should still be possible");
    });
    
     
    
    it('(airline) - single airline cannot register 5th airline by itself', async () => {
      var result = undefined;
      try {
        await config.flightSuretyApp.registerAirline("Emirates", airline5, {from: config.firstAirlineAddress});
      }
      catch(error) {
        console.log(error);
      }
      result = await config.flightSuretyData.isRegisteredAirline.call(airline5);
      assert.equal(result, false, "Registering the fifth airline should not be possible");
    });


    it('(airline) - 5th airline must go through a group consensus and at least more than 50% of registered airlines must approve/vote', async () => {
      try 
      {
        await config.flightSuretyApp.payAirline({from: airline2, value: AIRLINE_FEE, gasPrice: 0});
        await config.flightSuretyApp.registerAirline("Northwest", airline5, {from: airline2});
      }
      catch(error) {
        console.log(error);
      }
      
      var result = await config.flightSuretyData.isRegisteredAirline.call(airline5);      
      assert.equal(result, true, "Registering the 5th should be successful");
    });


    it('(airline) - 6th airline will fail since it approval will be less than 50%', async () => {
      
      var result = undefined;
      
      try 
      {
        result = await config.flightSuretyApp.registerAirline("Northwest", airline6, {from: airline2});
        result = await config.flightSuretyData.isRegisteredAirline.call(airline6);   
      }
      catch(error) 
      {
        console.log(error);
      }

      assert.equal(result, false, "Registering the 5th should be successful");
    });


    it('(airline) - get all registered airlines', async () => {
      
      var result = undefined;      
      result = await config.flightSuretyData.getRegisteredAirlines();      
      assert.equal(result.length, 5, "should be 5 registered airlines so far");
    });

  });

  describe('(flight) - test flight functionality', function() {
    it('(flight) - can register new flight', async () => {
      var result = undefined;
      
      try {
        
        await config.flightSuretyApp.registerFlight(flight1.flight, flight1.to, flight1.from, flight1.timestamp, {from: flight1.airline});
        await config.flightSuretyApp.registerFlight(flight2.flight, flight2.to, flight2.from, flight2.timestamp, {from: flight2.airline});s
      }
      catch(error) 
      {
        console.log(error);
      }

      result = await config.flightSuretyApp.isRegisteredFlight.call(flight1.airline, flight1.flight, flight1.timestamp);

      assert.equal(result, true, "Paid airline can register new flight");
    });

    

    it('(flight) -  cannot register a flight if the airline is not funded', async () => {
      var cancelled = false;
      try {
        await config.flightSuretyApp.registerFlight(flight3.flight, flight3.to, flight3.from, flight3.timestamp, {from: flight3.airline});
      }
      catch(error) {
        //console.log(error);
        cancelled = true;
      }

      assert.equal(cancelled, true, "Airline cannot register a flight if it is not funded");
    });

    it('(flight) -  cannot register a flight  more than once', async () => {
      var cancelled = false;
      try {
        await config.flightSuretyApp.registerFlight(flight1.flight, flight1.to, flight1.from, flight1.timestamp, {from: flight1.airline});
      }
      catch(error) {
        //console.log(error);
        cancelled = true;
      }

      assert.equal(cancelled, true, "Airline cannot register a flight more than once");
    });
  });

  it('(passenger) cannot purchase insurance without funds', async () => {
    var cancelled = false;
    try {
      await config.flightSuretyApp.purchaseInsurance(flight2.airline, flight2.flight, flight2.timestamp, {from: passenger1, value: 0, gasPrice: 0});
    }
    catch(error) {
      //console.log(error);
      cancelled = true;
    }

    assert.equal(cancelled, true, "No funds provided");
  });

  describe('(passenger) test passenger functionality', function() {
    it('(passenger) cannot purchase insurance for non-registered flight', async () => {
      var cancelled = false;
      try {
        await config.flightSuretyApp.purchaseInsurance(flight3.airline, flight3.flight, flight3.timestamp, {from: passenger1, value: PASSENGER_INSUR_VALUE, gasPrice: 0});
      }
      catch(error) {
        //console.log(error);
        cancelled = true;
      }

      assert.equal(cancelled, true, "Flight is not registered");
    });

   
    it('(passenger) can purchase insurance', async () => {
      console.log("passenger 1:" + passenger1);
      var result = undefined;
      try {
        //console.log(flight2);
        await config.flightSuretyApp.purchaseInsurance(flight2.airline, flight2.flight, flight2.timestamp, {from: passenger1, value: PASSENGER_INSUR_VALUE_1, gasPrice: 0});        
      }
      catch(error) {
        //console.log(error);
      }
      result = await debug(config.flightSuretyApp.isInsured.call(passenger1, flight2.airline, flight2.flight, flight2.timestamp));
      assert.equal(result, true, "Passenger can purchase insurance");
    });

    it('(passenger) cannot purchase insurance for the same flight twice', async () => {
      var cancelled = false;
      try {
        console.log("passenger 1 " + passenger1);
        await config.flightSuretyApp.purchaseInsurance(flight2.airline, flight2.flight, flight2.timestamp, {from: passenger1, value: PASSENGER_INSUR_VALUE_1, gasPrice: 0});
      }
      catch(error) {
        //console.log(error);
        cancelled = true;
      }

      assert.equal(cancelled, true, "Passenger must not be able to purchase insurance for the same flight more tha once");
    });


    it('(passenger) cannot purchase insurance beyond insurance limit', async () => {
      console.log("passenger 1:" + passenger1);
      var cancelled = false;
      try {        
        await debug(config.flightSuretyApp.purchaseInsurance(flight2.airline, flight2.flight, flight2.timestamp, {from: passenger1, value: PASSENGER_INSUR_VALUE_1 + 1, gasPrice: 0}));
      }
      catch(error) {
        //console.log(error);
        cancelled = true;
      }

      assert.equal(cancelled, true, "Insurance amount above theshold");
    });   

    it('(passenger) - more than one passenger can register for the same flight', async () => {
      var result = undefined;
      try {
        await config.flightSuretyApp.purchaseInsurance(flight2.airline, flight2.flight, flight2.timestamp, {from: passenger2, value: PASSENGER_INSUR_VALUE_2, gasPrice: 0});
      }
      catch(error) {
        console.log(error);
      }
      result = await config.flightSuretyApp.isInsured.call(passenger2, flight2.airline, flight2.flight, flight2.timestamp);
      assert.equal(result, true, "Passenger can purchase insurance");
    });
  
  });
});