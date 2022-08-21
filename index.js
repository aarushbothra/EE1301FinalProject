//"import" statements for different apis and libraries
const express = require('express');
const { GoogleSpreadsheet, GoogleSpreadsheetCell } = require('google-spreadsheet');
var Particle = require('particle-api-js');
let bodyParser = require('body-parser')

//create a particle object
var particle = new Particle();

// Initialize the sheet - doc ID is the long id in the sheets URL
const doc = new GoogleSpreadsheet('docID');

// Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
var creds = require('./credentials.json');

var difficultySelected = false;//boolean to track whether difficulty has been selected by player. if so, other website features become available

//create an express object
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

var token;//particle token for authentication with API
var particleID = 'randomNumbers'; //ID for particle photon

//log into particle cloud and get token to communicate with photon
particle.login({username: 'username@gmail.com', password: 'password'}).then(
  function(data) {
    token = data.body.access_token;
    console.log("Log in successful!")
  },
  function (err) {
    console.log('Could not log in.', err);
  }
);

//render main page. Usually called by a redirect.
app.get('/', async (req, res) => {
  res.render('index')
});


//output data from google sheet as json
app.get('/data1', async (req, res) => {
    // const { request, name } = req.body;
    await doc.useServiceAccountAuth(creds);
    
      
      await doc.loadInfo(); // loads document properties and worksheets
      
      //load sheet1 on google sheet document
      const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
     
      //constants to hold number of rows and columns
      const rowCount = 500
      const columnCount = 2

      //holds cell objects that represent each cell in a google sheet
      var sheetCells = [];

      //load cells on google sheet within given range
      await sheet.loadCells('A1:B500')
      
      //iterate through loaded cells from google sheet and initalize the sheetCells array with cell objects from google sheet
      for(var row=0;row<rowCount;row++){
        sheetCells[row] = [] //turn 1D sheetCells into 2D
        for (var column=0;column<columnCount;column++){
          sheetCells[row][column] = sheet.getCell(row, column);
        }
      }

      //hold the value of each cell as a string
      var cellContents = [];

      //iterate through each cell object in sheetCells. get the "value" parameter each cell and store it in cell contents
      for(var row=0;row<rowCount;row++){
        if (sheetCells[row][0].value != null){
          cellContents[row] = [] //turn 1D cell contents into 2D array, as long as value of sheetCell at that row is not null
        }
        for (var column=0;column<columnCount;column++){
          //ititailze cellContents as long as value of sheetCell at that spot is not null
          if (sheetCells[row][column].value != null){  
            cellContents[row][column] = sheetCells[row][column].value
          } 
          
        }
      
    
      }

      cellContents.sort(compareSecondColumn)//sorts the cellContents array by the second column

      res.json(cellContents);//publish cellContents array as a json file to /data1

  });


  //take input from the "name" form on website and score on maze from the particle. Add both to google sheet. Called via a post request
  app.post('/particle', async (req, res) => { 
    await doc.useServiceAccountAuth(creds);
    
      
      await doc.loadInfo(); // loads document properties and worksheets
      
      const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
     
      //row and column count of google sheet
      var rowCount = 500
      var columnCount = 2

      var sheetCells = []; //array to hold each cell object

      await sheet.loadCells('A1:B500')//load each cell in google sheet within given range
     
      for(var row=0;row<rowCount;row++){ //iterate through each row and column within given range of google sheet
        sheetCells[row] = [] //create 2D array
        for (var column=0;column<columnCount;column++){
          sheetCells[row][column] = sheet.getCell(row, column);//store each google sheet cell object in sheetCells
        }
      }

      var gameEnd = false;//tracks whether game has ended
      var display = true;//tracks whether to display an error message. express does not allow multiple messages to be sent to the same webpage.

      //get value of gameEnd from particle cloud. gameEnd will be true if game has ended, and false in all other cases. 
      await particle.getVariable({ deviceId: particleID, name: 'gameEnd', auth: token }).then(function(data) { 
        console.log('Device variable retrieved successfully:', data);
        gameEnd = data.body.result; //store cloud gameEnd value in local gameEnd value
      }, function(err) {
        console.log('An error occurred while getting attrs:', err);
        res.send("Unable to get data from particle photon. Please go back and retry.")//redirects website to /particle page and shows error message
        display = false;
      });

      console.log("------------------------------------")
      console.log("game end: " + gameEnd);
      
      if (gameEnd) {
        var playerScore;//variable to hold playerScore from particle cloud

        //get playerScore from particle cloud
        await particle.getVariable({ deviceId: particleID, name: 'playerScore', auth: token }).then(function(data) {
          console.log('Device variable retrieved successfully:', data);
          playerScore = data.body.result;
        }, function(err) {
          console.log('An error occurred while getting attrs:', err);
        });

        var name = req.body.name//get player name from website input
        
          for(var row=0;row<rowCount;row++){
            if (sheetCells[row][0].value == null){//iterate until first empty cell is found
              
              //if player hits enter on website without entering a name, a default name will be chosen
              if (name == null || name == undefined || name == ""){
                name = "Anonymus";
              }

              //if particle cloud returns an invalid value for playerScore, a default value of -1 will be chosen
              if (playerScore == null || playerScore == undefined || playerScore == "") {
                playerScore = -1;
              }

              //populate google sheet row with player name and score
              sheetCells[row][0].value = name
              sheetCells[row][1].value = playerScore;
              break;
            }
          
        
          }
    
          await sheet.saveUpdatedCells()//save updated cells to google sheet

          //resets particle by calling the difficulty select function in particle Cloud
          var fnPr = particle.callFunction({ deviceId: particleID, name: 'difficultySelect', argument: 'e', auth: token });
          await fnPr.then(
            function(data) {
              console.log('Function called succesfully:', data);
            }, function(err) {
              console.log('An error occurred:', err);
            });

            difficultySelected = false;
        
            res.redirect('/');//redirect website to home page
        
      } else if (display) {
        if (difficultySelected){
          res.send("Please wait until game has been completed. Press the back to return to leaderboard.")
        } else {
          res.send("Please select a difficulty first. Press the back arrow to retry.")
        }
        
      }
      
      
      
  });

  //get difficulty from "difficulty" form on website and send to particle to start game
  app.post('/difficulty', async (req, res) => { 
    var display = true;//tracks whether to display an error message. express does not allow multiple messages to be sent to the same webpage.
    var difficulty = req.body.difficulty.toLowerCase();//variable to store user input

    if (difficulty == 'e' || difficulty == 'm' || difficulty == 'h'){//check if user input is valid

      //call particle cloud function to set difficulty on particle
      var fnPr = particle.callFunction({ deviceId: particleID, name: 'difficultySelect', argument: difficulty, auth: token });
      await fnPr.then(
        function(data) {
          console.log('Function called succesfully:', data);
          difficultySelected = true;
        }, function(err) {
          console.log('An error occurred:', err);
          res.send("Unable to get data from particle photon. Please go back and retry.")
          display = false;
        });

        if (display) {
          res.redirect('/')
        }
        
    } else {//error message displayed for invalid user input
      res.send("Invalid difficulty. Press the back arrow to retry.")
    }
    
  })

  
//sorts a multidimensional array by second column in ascending order
function compareSecondColumn(a, b) {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] < b[1]) ? -1 : 1;
    }
}
  
  
  app.listen(1337, (req, res) => console.log("running on 1337")) //start express/node.js server