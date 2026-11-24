# Doodle Den - Testing Guide

## Start (no install)
Open the published page: https://claude.ai/artifact/4xFB2v6SyFQDaRYeBoSAcN
Enter a nickname, tap **Demo mode**. Runs entirely in your browser (no network, no cost).
Two simulated players ("Test Player N sim") join automatically; the Game Test Panel opens bottom-right.

## Real multiplayer
Create Room -> share link. Friends need a Claude account and Contributor access to the page.

## Checklist
1. Lobby: players listed, Start enabled once test players are ready -> Start Game.
2. Countdown -> word selection (3 cards; only the artist sees them). Use panel "Use test word".
3. Draw: line, circle, fast/slow, colors, sizes, eraser, undo, clear. Resize window; strokes must stay aligned.
4. Guess: Upper/lower case, extra spaces, punctuation, wrong, close ("So close!"), duplicate correct, artist can't guess.
5. Scoring: 1st 100, 2nd 80, 3rd 60, then 40 (x time factor 0.4-1.0); artist gets 40% of each + 30 if everyone guessed.
6. Timer: Pause/Resume, +/-10s, expiry. Skip Word Select / Turn / Round.
7. Disconnects: "Remove Test Player", "Artist Leaves" -> game must continue. Fewer than 2 players -> back to lobby.
8. Final: leaderboard, Play Again, Return to Lobby.

## Mobile
Open the link on a phone, or use browser device mode (portrait + landscape). Check canvas drawing without page scroll,
44px color swatches, Chat/Players tabs, no horizontal scroll.

## Known issues
- Not verified in a real browser by me; only syntax-checked.
- Host leaving ends the room (no host transfer in the online version).
- Late joiners cannot join a running game and miss earlier strokes.
- Secret word is not cryptographically hidden in real rooms (peers can read room messages).
- No automated test suite, sound, confetti, fill/line tools in this version.
- Your original local Next.js project was not available to me; this is the Doodle Den build from this chat.
