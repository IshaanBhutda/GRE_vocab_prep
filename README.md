# GRE Word Drill

**Live site: https://ishaanbhutda.github.io/GRE_vocab_prep/**

Free GRE vocabulary practice with friends. There are 4,660 words in 156 sets of 30. For each set you learn the words with flashcards, take a quiz, and see how you rank against everyone else.

---

## Getting started

1. Open the site and click **Sign in with Google**.
2. Optional: click **Rename** next to your name to choose the name others see on the rankings.
3. Open **Set 1** and work your way down the list.

You can practise without signing in, but your scores won't be saved or ranked. Once you sign in, your progress follows you to any device.

---

## How the sets are ordered

Set 1 comes first for a reason. The words are ranked by how often each one appears in written English, which puts the most GRE-like words in the early sets:

| Sets | What's in them |
|---|---|
| **1–20** | Core GRE words: *ascribe, concomitant, incisive, quibble, subterfuge* |
| **Middle sets** | Less common and more advanced words |
| **Last sets** | Everyday words you probably know already: *career, choice, figure* |

**Tip:** if you're short on time, focus on the first 40–60 sets.

Use the **All / Not quizzed / Quizzed** filters on the home page to find your next set quickly.

---

## Studying a set

Each set has four tabs. Work through them in order:

### 1 · Prepare (flashcards)

Click a card or press **Space** to flip it. Then mark the word:

- **Know it**: you got it right without hesitating.
- **Still learning**: you weren't sure. Be honest here; this pile is what you review.

| Key | Action |
|---|---|
| `Space` | Flip card |
| `←` `→` | Previous / next card |
| `K` | Know it |
| `L` | Still learning |

Click **Shuffle** under the card so you don't memorise the order. The bar at the bottom shows how many of the 30 words you know.

### 2 · Quiz

- You get all 30 words, once each, in random order.
- Half the questions show a **word** and ask for its meaning. The other half show a **meaning** and ask for the word.
- Each question has **4 options**. After every answer you see the full definition, with an example sentence where one exists.
- The quiz is **timed**.

| Key | Action |
|---|---|
| `1` `2` `3` `4` | Pick an answer |
| `Enter` | Next question |

Words you get wrong are added to your **Still learning** pile automatically, so the next Prepare round targets them.

Quitting halfway doesn't count. Only finished quizzes are scored.

### Rankings (for this set)

- Everyone who has quizzed this set, ranked by **best accuracy**.
- Retake as often as you like. Only your best attempt counts.
- If two people have the same accuracy, the **faster time** wins.

### Word list

All 30 words and definitions on one page. Good for a quick read before a retake.

---

## Overall rankings

The **Rankings** page at the top ranks every player by their **average best accuracy** across the sets they've quizzed.

- You need **3 quizzed sets** to get a rank.
- **Sets led** counts how many sets you're currently #1 on.
- Your own stats are at the top: average, sets quizzed, sets led and rank.

---

## A routine that works

1. **Prepare** a new set: go through it once, marking honestly.
2. Go through it again with **Shuffle**, focusing on the *Still learning* words.
3. Take the **Quiz**.
4. Read the **Review these** list on the results screen.
5. The next day, **retake** the quiz before starting a new set. Spaced review is what makes words stick.

Two or three sets a day covers the 60 core sets in about a month.

---

## FAQ

**My progress disappeared.**
Check you're signed in with the same Google account. Without signing in, progress is stored only in that browser.

**Can I reset a set's score?**
No, but only your best score counts, so a bad attempt never hurts you.

**A definition looks odd.**
Definitions come from a general dictionary, so occasionally the sense shown isn't the one the GRE usually tests (for example *incisive* = "suitable for cutting", where the GRE sense is "sharp, penetrating"). When in doubt, look the word up.

**Is it free?**
Yes. No ads, no account other than Google sign-in.

---

## Credits

Definitions: [Open English WordNet](https://en-word.net/), licensed CC BY 4.0.
Built with plain HTML/JS, Firebase (sign-in and rankings) and GitHub Pages.

<details>
<summary><b>Run your own copy</b></summary>

1. Create a Firebase project. Enable **Authentication → Google** and **Firestore** (production mode).
2. Paste `firestore.rules` into **Firestore → Rules** and click **Publish**.
3. Register a Web app and paste its config into `firebase-config.js`. Keep the `export` in `export const firebaseConfig = {`.
4. Push the files to a public GitHub repo. Enable **Settings → Pages → main / root**.
5. Add `<username>.github.io` under **Authentication → Settings → Authorized domains**.

</details>
