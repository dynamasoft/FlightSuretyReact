# Getting Started flight surety app.

There are 3 main component to this projects.
1. Smart-Contract
2. Server
3. Client

To launch the project, please follow the steps below:

1. Run `npm install` on each folder. I recommend open 3 seperate terminal so you can switch back and forth easily.
   Go to each following folders in the exact order and run the command
   1. Smart-Contract folder
   2. Server
   3. Client

2. Build and run script on each folder
   1. Go to Smart-Contract folder and run `truffle migrate --reset`
   2. You will notice 2 abi json files appear in the client/src/config/.  I had to do this since react doesn't allow access to folder outside src.

![image](https://user-images.githubusercontent.com/11653682/137628609-e4398564-4102-41d3-9c7b-5cade29bb926.png)

   3. Go to Server folder and run `npm start`. This will kick off some oracle code initialization.
![image](https://user-images.githubusercontent.com/11653682/137629394-01d90b66-a9c2-43bb-8dc5-06c949a2a3bc.png)


   3. Go to Client folder and run `npm start`. This will kick off the react server to run the client website.
![image](https://user-images.githubusercontent.com/11653682/137629511-39091800-fbce-479d-82aa-2950db48f63b.png)

   




