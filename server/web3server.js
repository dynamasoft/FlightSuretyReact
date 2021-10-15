import fs from 'fs';
debugger;
const FlightSuretyApp = JSON.parse(fs.readFileSync('./../smart-contract/build/contracts/FlightSuretyApp.json'));
const FlightSuretyData = JSON.parse(fs.readFileSync('./../smart-contract/build/contracts/FlightSuretyData.json'));
const Config =  JSON.parse(fs.readFileSync('./config/config.json'));
import Web3 from 'web3';
import express from 'express';

// Configuration
debugger;
let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);


// Status codes
const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;
const STATUS_CODES  = [
  STATUS_CODE_UNKNOWN,
  STATUS_CODE_ON_TIME,
  STATUS_CODE_LATE_AIRLINE,
  STATUS_CODE_LATE_WEATHER,
  STATUS_CODE_LATE_TECHNICAL,
  STATUS_CODE_LATE_OTHER
];

const ORACLES_MAX = 30;
const OFFSET = 5;
let oracles = [];
let accounts = []

// Get random status code
function randomize() {
  return STATUS_CODES[Math.floor(Math.random() * STATUS_CODES.length)];
}

function authorizeContract()
{
  let owner = accounts[0];  
  flightSuretyData.methods.authorizeContract(config.appAddress).send({from: owner}, (error, result) => 
  {
    if(error) 
    {
      console.log(error);
    } 
    else
    {
      console.log(`Configured authorized caller: ${config.appAddress}`);
    }

  });
}

function registerOracle()
{
  for(let a=OFFSET; a<ORACLES_MAX + OFFSET; a++) 
  {    
    flightSuretyApp.methods.registerOracle().send({from: accounts[a], value: web3.utils.toWei("1",'ether'), gas: 4500000}, (error, result) =>
    {
      if(error) 
      {
        debugger;
        console.log(error);
      } 
    });
  }
}

function getOracleIndexes()
{
  for(let a=OFFSET; a<ORACLES_MAX + OFFSET; a++) 
  {   
        flightSuretyApp.methods.getMyIndexes().call({from: accounts[a]}, (error, result) => 
        {
          if (error) {
            debugger;
          }
          else {
            let oracle = {address: accounts[a], index: result};
            console.log(`Oracle: ${JSON.stringify(oracle)}`);
            oracles.push(oracle);
          }
        });
  }
}

web3.eth.getAccounts((error, acct) => {

  debugger;
  accounts = acct;
  authorizeContract();
  registerOracle();
  getOracleIndexes();

});


debugger;
flightSuretyApp.events.OracleRequest({fromBlock: 0}, function (error, event) 
{  
  debugger;
    let index = event.returnValues.index;
    let airline = event.returnValues.airline;
    let flight = event.returnValues.flight;
    let timestamp = event.returnValues.timestamp;
    let statusCode = randomize();

    for(let a=0; a<oracles.length; a++) 
    {
      if(oracles[a].index.includes(index)) 
      {
        flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode).send({from: oracles[a].address}, (error, result) => 
        {         
            console.log(`${JSON.stringify(oracles[a])}: Oracle Status code ${statusCode}`);         
        });
      }
    }  
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;