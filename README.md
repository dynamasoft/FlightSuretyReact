# Getting Started flight surety app.

There are 3 main component to this projects.
1. Smart-Contract
2. Server
3. Client

To launch the project, please follow the steps below. Please keep in mind that this project was built in Windows 10.

1. Run `npm install` on each folder. I recommend open 3 seperate terminal so you can switch back and forth easily.
   Go to each following folders in the exact order and run the command
   1. Smart-Contract folder
   2. Server
   3. Client

2. Build and run script on each folder
   1. Run your local ganache. Make sure to set 100 accounts with 1000 ether on each account. 
   2. Edit truffle-config and set this const mnemonic = your own mnemonic from ganache.
   3. Copy the mnemonic and paste it to your the truffle-config file 
   4. Go to Smart-Contract folder and run `truffle migrate --reset`
   5. You will notice 2 abi json files appear in the client/src/config/.  I had to do this since react doesn't allow access to folder outside src.

![image](https://user-images.githubusercontent.com/11653682/137628609-e4398564-4102-41d3-9c7b-5cade29bb926.png)

   4. Go to Server folder and run `npm start`. This will kick off some oracle code initialization.
![image](https://user-images.githubusercontent.com/11653682/137629394-01d90b66-a9c2-43bb-8dc5-06c949a2a3bc.png)


   5. Go to Client folder and run `npm start`. This will kick off the react server to run the client website. You can start interact with the smart contract.
![image](https://user-images.githubusercontent.com/11653682/137629511-39091800-fbce-479d-82aa-2950db48f63b.png)

   

3. Test Smart Contract.
    1. Go to smart-contract folder and run 'Truffle Test'
    2. There are two different test and they will run one after another.
       1. FlightSurety Test
       2. Oracle Test

Here is the snippet. I hope this helps.
![image](https://user-images.githubusercontent.com/11653682/137629780-2622c797-3e0e-426c-a5bd-10e9a08a2ac8.png)



