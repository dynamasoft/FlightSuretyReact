const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const { Console } = require('console');
const fs = require('fs');

module.exports = function(deployer, network, accounts) {
  //console.log("dirname:" + __dirname+ '/../../client/src/config/config.json');
  //return;
  let firstAirlineName = "Swiss International Airlines";
  let firstAirlineAddress = accounts[1];
  // Airline Contract Initialization: First airline is registered when contract is deployed
  deployer.deploy(FlightSuretyData, firstAirlineName, firstAirlineAddress).then(() => {
    return deployer.deploy(FlightSuretyApp, FlightSuretyData.address).then(() => {
      let config = {
        localhost: {
          url: 'http://localhost:7545',
          dataAddress: FlightSuretyData.address,
          appAddress: FlightSuretyApp.address
        }
      }
      debugger;
      fs.writeFileSync(__dirname + '/../../client/src/config/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
      fs.writeFileSync(__dirname + '/../../server/config/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
     
      fs.copyFile(__dirname + '/../build/contracts/FlightSuretyApp.json', __dirname + '/../../client/src/config/FlightSuretyApp.json',(err) =>
      {
        if (err) {
          console.log("Error Found:", err);
        }
      });

      fs.copyFile(__dirname + '/../build/contracts/FlightSuretyData.json', __dirname + '/../../client/src/config/FlightSuretyData.json',(err) =>
      {
        if (err) {
          console.log("Error Found:", err);
        }
      });
      



      



    });
  });
}