var Test = require("../config/testConfig.js");
contract("Oracles", async (accounts) => {   
  
  const TIMESTAMP = Math.floor(Date.now() / 1000);
  const STATUS_CODE_LATE_AIRLINE = 25;
  const ORACLES_MAX = 25;
  const OFFSET = 25;

  // Airlines information
  let airline2 = accounts[2];
  let flight1 = {
    airline: airline2,
    flight: "1234",
    from: "AAA",
    to: "BBB",
    timestamp: TIMESTAMP,
  };
  let flight2 = {
    airline: airline2,
    flight: "5678",
    from: "CCC",
    to: "DDD",
    timestamp: TIMESTAMP,
  };

  let airline3 = accounts[3];
  let flight3 = {
    airline: airline3,
    flight: "3333",
    from: "EEE",
    to: "FFF",
    timestamp: TIMESTAMP,
  };
  let airline4 = accounts[4];
  let flight4 = {
    airline: airline4,
    flight: "5533",
    from: "GGG",
    to: "SSS",
    timestamp: TIMESTAMP,
  };

  let airline5 = accounts[5];

  var config;
  
  before("setup oracle", async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address);
  });

  describe("(oracles) test oracles functionality", function ()   
  {

    it("(oracles) -  can register oracles", async () => {
      let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();
      for (let i = 1; i < ORACLES_MAX; i++) 
      {
        await config.flightSuretyApp.registerOracle({
          from: accounts[i + OFFSET],
          value: fee,
        });      
      }
    });

    it("(oracles) - can get indexes", async () => {

      for (let i = 1; i < ORACLES_MAX; i++) 
      {
        let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[i + OFFSET],});
        console.log('Registered Oracle Indexes:' + result[0] + ' ' +  result[1] + ' ' + result[2]);
      }
    });

    it("(oracles) - request flight status", async () => 
    {
      let flight = flight2.flight;
      let timestamp = flight2.timestamp;
      let airline = flight2.airline;

      await config.flightSuretyApp.fetchFlightStatus(
        airline,
        flight,
        timestamp
      );

      for (let a = 1; a < ORACLES_MAX; a++) 
      {
        let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({
          from: accounts[a + OFFSET],
        });

        for (let index = 0; index < 3; index++) 
        {
          try {
            await config.flightSuretyApp.submitOracleResponse(
              oracleIndexes[index],
              airline,
              flight,
              timestamp,
              STATUS_CODE_LATE_AIRLINE,
              { from: accounts[a + OFFSET] }
            );
          } catch (e) {}
        }
      }
    });  
  });
});
