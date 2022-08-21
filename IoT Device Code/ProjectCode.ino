// EE 1301 Final Project
// Blind Maze
// Max Lee, Aarush Bothra, Isaiah Wildenberg

#include <stdlib.h>
#include "Particle.h"
#include "neopixel.h"

const char BLANK = '-';
const char ROBOT = 'X';
const char GOAL = 'O';
const char BORDER = 'W';
const char POINT = 'P';

const int lengthX = 10;
const int lengthY = 10;
  
int PIXEL_PIN = D4;
int PIXEL_COUNT = 4;
int PIXEL_TYPE = WS2812;

Adafruit_NeoPixel strip = Adafruit_NeoPixel(PIXEL_COUNT, PIXEL_PIN, PIXEL_TYPE);
int Red, Green, Blue, myColor, PixelID;
int PixelColorGreen = strip.Color( 155, 0, 0); 
int PixelColorRed = strip.Color( 0, 155, 0); 
int PixelColorBlue = strip.Color( 0, 0, 155);
int PixelColorWhite = strip.Color( 155, 155, 155);
int PixelColorGold = strip.Color( 50, 60, 5);

char easy[101] = "WWWWWWWWWWW-P-----OWW-WWW-WWWWW--------WWWWW-WWWPWWW---WWWWWWW-WWWPWWWWW-----WWWWX-WWPWWWWWWWWWWWWWW";
char medium[101] = "WWWWWWWWWWW-P------WW-WWWWWW-WW----WO--WWWW-WWWW-WWP--W----WWW-WWWWW-WW---W----WWXW---WWPWWWWWWWWWWW";
char hard[101] = "WWWWWWWWWWWX-------WW-WWWW-WPWW----W---WWWWWWWWW-WW--PWW---WW-WWW--WWWW-----W--WWPW-W----WWWWWWWWWOW";

int motorPin = D0;
int joyButtonPin = D1;
int joyXpin = A0;
int joyYpin = A1;

void customInitBoard(char board[lengthX][lengthY], int &xPos, int &yPos, char mazeDiff[101]);
bool hasChar(char board[lengthX][lengthY], char findMe);
void updateGrid(char board[10][10], int &xPos, int &yPos, char direction);
void directional(char board[lengthX][lengthY], int &xPos, int &yPos);
void points(char board[lengthX][lengthY], int pts);
char movement(int joyX, int joyY);
void resart();

String difficulty = "e"; // will hold the entry that will designate the difficulty, this will be changed for the html site

bool finished = false; // when the maze is complete this will be made false
char board[lengthX][lengthY] = {0};
int xPos = 0, yPos = 0; // position of player
int pts = 0; // tracks the points in the maze


void setup() {
  Serial.begin(9600);
  // Particle.subscribe("Difficulty", difficulty);
  Particle.variable("Difficulty", &difficulty, STRING);

  strip.begin();

  pinMode(motorPin, OUTPUT);
  pinMode(joyButtonPin, INPUT_PULLUP);
  digitalWrite(motorPin, LOW);

  if (difficulty == "e") { // sets the difficults for the maze
          customInitBoard(board, xPos, yPos, easy); // takes in the map for the game
  }
  else if (difficulty == "m") {
          customInitBoard(board, xPos, yPos, medium);
  }
  else if (difficulty == "h") {
          customInitBoard(board, xPos, yPos, hard);
  }
  else {
      Serial.println("Invalid, please retry.");
  }
}

void loop() {
    if(!finished) {
        directional(board, xPos, yPos); // tracks the adjacent positions
    }

    static int prevJoyX = 2700;
    static int prevJoyY = 2700;
    int joyX = analogRead(joyXpin);
    int joyY = analogRead(joyYpin);

    if( (joyX < 1000 && prevJoyX > 1000) ||
        (joyX > 3500 && prevJoyX < 3500) ||
        (joyY < 1000 && prevJoyY > 1000) ||
        (joyY > 3500 && prevJoyY < 3500) 
        ) {

        char direction = movement(joyX, joyY);
        Serial.println(direction);
        updateGrid(board, xPos, yPos, direction);
    }
    prevJoyX = joyX;
    prevJoyY = joyY;
    

    if(!hasChar(board, GOAL)){
      if(!finished) {
        Serial.println("The maze has been completed!");
        Serial.println("Your Score is: ");
        Serial.println(millis());
      }
      finished = true;

      static unsigned long int lastToggleTime = millis();
      unsigned long int currentTime = millis();
      static bool LEDState = false;
      if(currentTime - lastToggleTime > 200){
        LEDState = !LEDState;
        if(LEDState) {
          strip.setPixelColor(0, PixelColorGold);
          strip.setPixelColor(1, PixelColorGold);
          strip.setPixelColor(2, PixelColorGold);
          strip.setPixelColor(3, PixelColorGold);
          digitalWrite(motorPin, HIGH);
        }
        else{
          strip.setPixelColor(0, PixelColorBlue);
          strip.setPixelColor(1, PixelColorBlue);
          strip.setPixelColor(2, PixelColorBlue);
          strip.setPixelColor(3, PixelColorBlue);
          digitalWrite(motorPin, LOW);
        }
        strip.show();
        lastToggleTime = currentTime;
      }  

      if(digitalRead(joyButtonPin) == LOW){
        resart();
      }
    }

    static unsigned long int lastPressTime = millis();
    bool state = digitalRead(joyButtonPin);
    if(state == LOW) {
      unsigned long int currentPressTime = millis();
      if(currentPressTime - lastPressTime > 1000) {
        resart();
      }
    }
    else if(state == HIGH) {
      lastPressTime = millis();
    }

}

/* 
    Directional will look at the adjacent positions and then print "R" for red, signifying
a border is in that panel. With the particle instead of couting the "R" an LED will be made red.
The same process is done for "G" (green) and "P" for points which wil be made some other color 
(white maybe) and "O" for the final location (blue?)
*/
void directional(char board[lengthX][lengthY], int &xPos, int &yPos) {
    if (board[xPos][yPos - 1] == 'W') {
        strip.setPixelColor(0, PixelColorRed);
        
    }
    else if (board[xPos][yPos - 1] == 'P'){
        strip.setPixelColor(0, PixelColorWhite);
        
    }
    else if (board[xPos][yPos - 1] == 'O'){
        strip.setPixelColor(0, PixelColorBlue);
        
    }
    else {
        strip.setPixelColor(0, PixelColorGreen);
        
    }

    if (board[xPos - 1][yPos] == 'W') {
        strip.setPixelColor(1, PixelColorRed);
        
    }
    else if (board[xPos - 1][yPos] == 'P'){
        strip.setPixelColor(1, PixelColorWhite);
        
    }
    else if (board[xPos - 1][yPos] == 'O'){
        strip.setPixelColor(1, PixelColorBlue);
        
    }
    else {
        strip.setPixelColor(1, PixelColorGreen);
        
    }

    if (board[xPos + 1][yPos] == 'W') {
        strip.setPixelColor(2, PixelColorRed);
        
    }
    else if (board[xPos + 1][yPos] == 'P'){
        strip.setPixelColor(2, PixelColorWhite);
        
    }
    else if (board[xPos + 1][yPos] == 'O'){
        strip.setPixelColor(2, PixelColorBlue);
        
    }
    else {
        strip.setPixelColor(2, PixelColorGreen);
        
    }

    if (board[xPos][yPos + 1] == 'W') {
        strip.setPixelColor(3, PixelColorRed);
        
    }
    else if (board[xPos][yPos + 1] == 'P'){
        strip.setPixelColor(3, PixelColorWhite);
        
    }
    else if (board[xPos][yPos + 1] == 'O'){
        strip.setPixelColor(3, PixelColorBlue);
        
    }
    else {
        strip.setPixelColor(3, PixelColorGreen);
        
    }
    strip.show();
}


/* 
    custonInitBoard takes in the map from the file that was designated when selecting difficulty
using the "mazeDiff" variable. The file is open, the map is taken in, and the location of the
start and the finish is stored.
*/
void customInitBoard(char board[lengthX][lengthY], int &xPos, int &yPos, char mazeDiff[101]) {
    for(int curRow = 0; curRow < lengthY; curRow++) {
        for(int curCol = 0; curCol < lengthX; curCol++) {
            board[curCol][curRow] = mazeDiff[curRow * 10 + curCol];
            Serial.print(board[curCol][curRow]);
            if (board[curCol][curRow] == 'X') { 
                xPos = curCol;
                yPos = curRow;
                board[curCol][curRow] = ROBOT;
            }
            else if (board[curCol][curRow] == 'O') { 
                board[curCol][curRow] = GOAL;
            }
            Serial.println();
        }
    }
}

/* 
    hasChar is returns true if the maze is in progress and returns false once finished
*/
bool hasChar(char board[lengthX][lengthY], char findMe) { 
    for(int curRow = 0; curRow < lengthY; curRow++) {
        for(int curCol = 0; curCol < lengthX; curCol++) {
            if(board[curCol][curRow] == findMe) {
                return true;
            }
        } 
    } 

    return false;
}

/* 
    Points scans the board for the amount of points or "P"s on the board and tells the user
how many remain. (It doesnt say how many you've gotten because doing so has been very finnicky
and I havent gotten it to work right, you guys can try to do it if you like but this is a lot easier)
*/
void points(char board[lengthX][lengthY], int pts) {
    Serial.println("Points Remaining: ");
    for(int curRow = 0; curRow < lengthY; curRow++) {
        for(int curCol = 0; curCol < lengthX; curCol++) {
            if(board[curCol][curRow] == 'P') {
                pts++;
            }
        }
    }
    Serial.println(pts);
}

/* 
    updateGrid just updates the map and locations based on the movement, instead of using the keys
in the final version the joystick will be swapped in.
*/
void updateGrid(char board[10][10],int & xPos, int & yPos, char direction) {
    board[xPos][yPos] = BLANK;
    if (direction == 'l' && xPos > 0 && board[xPos - 1][yPos] != 'W') {
      xPos--;
    } 
    else if (direction == 'r' && xPos < lengthX - 1 && board[xPos + 1][yPos] != 'W') {
      xPos++;
    } 
    else if (direction == 'u' && yPos > 0 && board[xPos][yPos - 1] != 'W') {
      yPos--;
    } 
    else if( direction == 'd' && yPos < lengthY - 1 && board[xPos][yPos + 1] != 'W') {
      yPos++;
    }
    else {
      digitalWrite(motorPin, HIGH);
      delay(500);
      digitalWrite(motorPin, LOW);
    }

    board[xPos][yPos] = ROBOT;
}

char movement(int joyX, int joyY) {
  char action;
  if (joyX < 1000) {
    action = 'd';
  }
  else if (joyX > 3500) {
    action = 'u';
  }
  else if (joyY < 1000) {
    action = 'l';
  }
  else if (joyY > 3500) {
    action = 'r';
  }
  else {
    action = 'x';
  }

  return action;
}

void restart() {
    strip.setPixelColor(0, PixelColorWhite);
    strip.setPixelColor(1, PixelColorWhite);
    strip.setPixelColor(2, PixelColorWhite);
    strip.setPixelColor(3, PixelColorWhite);
    strip.show();
    System.reset();
}