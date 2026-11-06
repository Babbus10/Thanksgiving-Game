# Thanksgiving Escape

A collaborative escape-room game for six kids, played in a browser on one laptop. Mom (or any adult) drives the mouse and keyboard. Put the laptop in full screen and stream it to a TV so everyone can read along.

JMa drops the kids at an empty school after a forged notice from Principal.exe. Solve the room puzzles, print the passes, cure the school AI, and get home for Thanksgiving dinner.

## Play

1. Open `index.html` in Chrome, Edge, Firefox, or Safari.
   - Double-click the file, or
   - From this folder, run `python3 -m http.server 8080` and visit [http://localhost:8080](http://localhost:8080).
2. Click **Full screen** (or press F11) so the TV shows only the game.
3. Enter the six kids from **youngest to oldest**, and pick a boy or girl color for each. There are three of each, and each look is used once.
4. Read the short story, then investigate the lobby.

Progress is saved in this browser. **Play again** on the ending screen starts a new game. **Start over** in the clue pocket does the same thing mid-game.

## How a turn works

The youngest kid investigates first, then the next oldest, and so on. The banner shows whose turn it is. Everyone can talk about the puzzle. That kid submits the answer.

Wrong answers give a hint and can be tried again. **Next kid** passes the turn. The art room opens only for the younger three.

Keyboard: Tab to move, Enter to activate a button or submit a typed answer, and F for full screen when you are not typing.

## Rooms

Lobby printer, hallway, art room, math room, cafeteria, gym, principal's office, then Principal.exe. Passes are printed in the lobby. White ink is labeled. Later colors stay unlabeled until a clue names them.

The clue pocket keeps passes, colors, and code scraps.

Gold outlines mark things to investigate. The kid whose turn it is walks to that spot. Some outlines are jokes and do not start a puzzle. Room pictures are original illustrated photographs made for this game and live in `assets/rooms/`.
