import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from './supabaseClient.js';
import Logo from './Logo.jsx';
import PdfPreviewModal from './PdfPreviewModal.jsx';
import { shuffle, ListenCircleTask, ColorBoxTask, MatchTask, FillInTask, TrueFalseTask } from './WorksheetTasks.jsx';
import { styles } from './styles.js';


// ─── DATA ────────────────────────────────────────────────────────────────────

const TOPICS = [
  { id: "alphabet", emoji: "🔤", name: "Alphabet", desc: "Slova — Stars & Heroes", grade: "1" },
  { id: "colors", emoji: "🎨", name: "Colors", desc: "Boje — Mickey, Minnie, Donald…", grade: "1" },
  { id: "numbers", emoji: "🔢", name: "Numbers 1–20", desc: "Brojevi — Stars & Heroes", grade: "1" },
  { id: "animals", emoji: "🐾", name: "Animals", desc: "Pluto, Simba, Nemo i drugi", grade: "1" },
  { id: "family", emoji: "👨‍👩‍👧", name: "Family", desc: "Porodica — Stars & Heroes", grade: "1" },
  { id: "body", emoji: "🧍", name: "Body parts", desc: "Delovi tela — Mickey & friends", grade: "2" },
  { id: "food", emoji: "🍎", name: "Food", desc: "Hrana — Stars & Heroes", grade: "2" },
  { id: "am_is_are", emoji: "✏️", name: "am / is / are", desc: "Mickey is happy — glagol to be", grade: "2" },
  { id: "a_an", emoji: "📝", name: "a / an", desc: "Neodređeni član — Stars & Heroes", grade: "2" },
  { id: "classroom", emoji: "🏫", name: "Classroom", desc: "Učionica — Stars & Heroes", grade: "2" },
  // Grade 3
  { id: "sports", emoji: "⚽", name: "Sports", desc: "Sportovi — Mickey & Heroes", grade: "3" },
  { id: "clothes", emoji: "👕", name: "Clothes", desc: "Minnie's dress, Donald's hat…", grade: "3" },
  { id: "adjectives", emoji: "📏", name: "Adjectives", desc: "Pridevi — Stars & Heroes", grade: "3" },
  { id: "prepositions", emoji: "📦", name: "Prepositions", desc: "Gde je Mickey? in/on/under…", grade: "3" },
  { id: "present_simple_3rd", emoji: "🔄", name: "Present Simple", desc: "Mickey plays, Minnie reads…", grade: "3" },
  // Grade 4
  { id: "comparatives", emoji: "📊", name: "Comparatives", desc: "Poređenje prideva", grade: "4" },
  { id: "have_has", emoji: "🤲", name: "have / has", desc: "Glagol have i has", grade: "4" },
  { id: "plurals", emoji: "📚", name: "Plurals", desc: "Množina imenica", grade: "4" },
  { id: "do_does", emoji: "❓", name: "Do / Does?", desc: "Pitanja u sadašnjem vremenu", grade: "4" },
  // Grade 5
  { id: "past_simple_regular", emoji: "⏮️", name: "Past Simple", desc: "Pravilni glagoli (-ed)", grade: "5" },
  { id: "past_simple_irregular", emoji: "⚡", name: "Irregular Verbs", desc: "Nepravilni glagoli", grade: "5" },
  { id: "past_simple_negative", emoji: "❌", name: "Past Simple — didn't", desc: "Negacija u prošlom vremenu", grade: "5" },
  // Grade 6
  { id: "past_simple_questions", emoji: "🔍", name: "Past Simple — Did?", desc: "Pitanja u prošlom vremenu", grade: "6" },
  { id: "past_simple_mixed", emoji: "🔀", name: "Past Simple — Mix", desc: "Mešoviti zadaci", grade: "6" },
];

// ─── TASK GENERATORS ─────────────────────────────────────────────────────────

function makeTFFromPairs(pairs, count) {
  const selected = shuffle(pairs).slice(0, Math.min(count, pairs.length));
  const allSr = pairs.map(p => p.sr);
  const targetCorrect = Math.round(selected.length / 2);
  const correctIndices = new Set(shuffle([...Array(selected.length).keys()]).slice(0, targetCorrect));
  return {
    type: "tf",
    instruction: "Zaokruži TRUE ako je prevod tačan, FALSE ako nije.",
    items: selected.map((p, i) => {
      if (correctIndices.has(i)) {
        return { sentence: `"${p.en}" znači "${p.sr}"`, answer: true };
      }
      const wrongOptions = allSr.filter(s => s !== p.sr);
      const wrong = wrongOptions.length > 0 ? shuffle(wrongOptions)[0] : p.sr;
      return { sentence: `"${p.en}" znači "${wrong}"`, answer: wrong === p.sr };
    }),
  };
}

function generateTasks(topicId, count, taskType) {
  const data = TOPIC_DATA[topicId];
  if (!data) return null;
  return data.generate(count, taskType);
}

const TOPIC_DATA = {
  colors: {
    generate(count) {
      const all = [
        { word: "red", sr: "crvena" }, { word: "blue", sr: "plava" },
        { word: "green", sr: "zelena" }, { word: "yellow", sr: "žuta" },
        { word: "orange", sr: "narandžasta" }, { word: "purple", sr: "ljubičasta" },
        { word: "pink", sr: "roze" }, { word: "black", sr: "crna" },
        { word: "white", sr: "bela" }, { word: "brown", sr: "braon" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 10));
      return {
        type: "color-boxes",
        instruction: "Oboj svako polje bojom koja piše ispod! 🖍️ Mickey, Minnie i Donald vole boje.",
        teacherNote: "Nastavnik čita svaku boju na engleskom (2×). Deca boje polje odgovarajućom bojom.",
        items,
      };
    },
  },

  numbers: {
    generate(count) {
      const all = [
        { word: "one", emoji: "1️⃣", sr: "jedan" }, { word: "two", emoji: "2️⃣", sr: "dva" },
        { word: "three", emoji: "3️⃣", sr: "tri" }, { word: "four", emoji: "4️⃣", sr: "četiri" },
        { word: "five", emoji: "5️⃣", sr: "pet" }, { word: "six", emoji: "6️⃣", sr: "šest" },
        { word: "seven", emoji: "7️⃣", sr: "sedam" }, { word: "eight", emoji: "8️⃣", sr: "osam" },
        { word: "nine", emoji: "9️⃣", sr: "devet" }, { word: "ten", emoji: "🔟", sr: "deset" },
        { word: "eleven", emoji: "1️⃣1️⃣", sr: "jedanaest" }, { word: "twelve", emoji: "1️⃣2️⃣", sr: "dvanaest" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže broj na engleskom. Zaokruži odgovarajući broj! 🔢",
        teacherNote: "Izgovorite broj na engleskom 2–3 puta. Deca zaokružuju cifru/kartu.",
        items,
      };
    },
  },

  animals: {
    generate(count) {
      const all = [
        { word: "cat", emoji: "🐱", sr: "mačka" }, { word: "dog", emoji: "🐶", sr: "pas" },
        { word: "cow", emoji: "🐄", sr: "krava" }, { word: "horse", emoji: "🐴", sr: "konj" },
        { word: "bird", emoji: "🐦", sr: "ptica" }, { word: "fish", emoji: "🐟", sr: "riba" },
        { word: "rabbit", emoji: "🐰", sr: "zec" }, { word: "lion", emoji: "🦁", sr: "lav" },
        { word: "elephant", emoji: "🐘", sr: "slon" }, { word: "monkey", emoji: "🐒", sr: "majmun" },
        { word: "snake", emoji: "🐍", sr: "zmija" }, { word: "frog", emoji: "🐸", sr: "žaba" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže životinju na engleskom. Zaokruži odgovarajuću sliku! 🐾 Pluto je dog, Simba je lion, Nemo je fish!",
        teacherNote: "Izgovorite ime životinje 2–3 puta. Deca zaokružuju sličicu.",
        items,
      };
    },
  },

  family: {
    generate(count) {
      const all = [
        { word: "mother", emoji: "👩", sr: "mama" }, { word: "father", emoji: "👨", sr: "tata" },
        { word: "sister", emoji: "👧", sr: "sestra" }, { word: "brother", emoji: "👦", sr: "brat" },
        { word: "grandmother", emoji: "👵", sr: "baka" }, { word: "grandfather", emoji: "👴", sr: "deda" },
        { word: "aunt", emoji: "👩‍🦰", sr: "tetka" }, { word: "uncle", emoji: "👨‍🦱", sr: "ujak" },
        { word: "baby", emoji: "👶", sr: "beba" }, { word: "family", emoji: "👨‍👩‍👧‍👦", sr: "porodica" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 10));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže člana porodice na engleskom. Zaokruži odgovarajuću sličicu! 👨‍👩‍👧",
        teacherNote: "Izgovorite reč 2–3 puta. Deca zaokružuju odgovarajući emoji.",
        items,
      };
    },
  },

  body: {
    generate(count) {
      const all = [
        { word: "head", emoji: "🗣️", sr: "glava" }, { word: "eye", emoji: "👁️", sr: "oko" },
        { word: "nose", emoji: "👃", sr: "nos" }, { word: "mouth", emoji: "👄", sr: "usta" },
        { word: "ear", emoji: "👂", sr: "uho" }, { word: "hand", emoji: "✋", sr: "ruka" },
        { word: "foot", emoji: "🦶", sr: "stopalo" }, { word: "leg", emoji: "🦵", sr: "noga" },
        { word: "arm", emoji: "💪", sr: "nadlaktica" }, { word: "finger", emoji: "☝️", sr: "prst" },
        { word: "teeth", emoji: "🦷", sr: "zubi" }, { word: "hair", emoji: "💇", sr: "kosa" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže deo tela na engleskom. Zaokruži odgovarajuću sličicu! 🧍",
        teacherNote: "Izgovorite deo tela 2–3 puta. Deca zaokružuju sličicu i mogu pokazati na sebi.",
        items,
      };
    },
  },

  food: {
    generate(count) {
      const all = [
        { word: "apple", emoji: "🍎", sr: "jabuka" }, { word: "bread", emoji: "🍞", sr: "hleb" },
        { word: "milk", emoji: "🥛", sr: "mleko" }, { word: "egg", emoji: "🥚", sr: "jaje" },
        { word: "banana", emoji: "🍌", sr: "banana" }, { word: "cheese", emoji: "🧀", sr: "sir" },
        { word: "juice", emoji: "🧃", sr: "sok" }, { word: "water", emoji: "💧", sr: "voda" },
        { word: "cake", emoji: "🎂", sr: "torta" }, { word: "soup", emoji: "🍲", sr: "supa" },
        { word: "pizza", emoji: "🍕", sr: "pica" }, { word: "ice cream", emoji: "🍦", sr: "sladoled" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže hranu na engleskom. Zaokruži odgovarajuću sličicu! 🍎",
        teacherNote: "Izgovorite naziv hrane 2–3 puta. Deca zaokružuju sličicu.",
        items,
      };
    },
  },

  classroom: {
    generate(count) {
      const all = [
        { word: "pencil", emoji: "✏️", sr: "olovka" }, { word: "book", emoji: "📚", sr: "knjiga" },
        { word: "ruler", emoji: "📏", sr: "lenjir" }, { word: "eraser", emoji: "🧹", sr: "gumica" },
        { word: "bag", emoji: "🎒", sr: "torba" }, { word: "desk", emoji: "🪑", sr: "klupa" },
        { word: "pen", emoji: "🖊️", sr: "hemijska" }, { word: "notebook", emoji: "📓", sr: "sveska" },
        { word: "scissors", emoji: "✂️", sr: "makaze" }, { word: "glue", emoji: "🖇️", sr: "lepak" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 10));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže predmet iz učionice na engleskom. Zaokruži odgovarajuću sličicu! 🏫",
        teacherNote: "Izgovorite predmet 2–3 puta. Deca zaokružuju sličicu i mogu pokazati predmet u učionici.",
        items,
      };
    },
  },

  am_is_are: {
    generate(count) {
      const pool = shuffle([
        { sentence: "I ___ a student.", answer: "am", hint: "I" },
        { sentence: "Mickey ___ very happy.", answer: "is", hint: "Mickey" },
        { sentence: "Minnie ___ a great dancer.", answer: "is", hint: "Minnie" },
        { sentence: "Donald and Goofy ___ best friends.", answer: "are", hint: "Donald and Goofy" },
        { sentence: "Minnie and Daisy ___ in the park.", answer: "are", hint: "Minnie and Daisy" },
        { sentence: "Pluto ___ a big dog.", answer: "is", hint: "Pluto" },
        { sentence: "You ___ my friend.", answer: "are", hint: "You" },
        { sentence: "Goofy ___ very tall.", answer: "is", hint: "Goofy" },
        { sentence: "I ___ hungry.", answer: "am", hint: "I" },
        { sentence: "Mickey and Minnie ___ in the clubhouse.", answer: "are", hint: "Mickey and Minnie" },
        { sentence: "Donald ___ funny.", answer: "is", hint: "Donald" },
        { sentence: "We ___ good friends.", answer: "are", hint: "We" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: 'Popuni rečenice sa am, is ili are. ⭐ Mickey, Minnie, Donald i prijatelji pomažu!',
        wordBank: ["am", "is", "are"],
        items: pool,
      };
    },
  },

  a_an: {
    generate(count) {
      const pool = shuffle([
        { sentence: "___ apple (Minnie's favourite)", answer: "an", hint: "(počinje samoglasnikom)" },
        { sentence: "___ book (from Mickey's library)", answer: "a", hint: "(počinje suglasnikom)" },
        { sentence: "___ orange hat (just like Goofy's)", answer: "an", hint: "(počinje samoglasnikom)" },
        { sentence: "___ dog (just like Pluto!)", answer: "a", hint: "(počinje suglasnikom)" },
        { sentence: "___ elephant (just like Dumbo)", answer: "an", hint: "(počinje samoglasnikom)" },
        { sentence: "___ car (Mickey's red car)", answer: "a", hint: "(počinje suglasnikom)" },
        { sentence: "___ umbrella (Goofy has one)", answer: "an", hint: "(počinje samoglasnikom)" },
        { sentence: "___ big clubhouse (Mickey's!)", answer: "a", hint: "(počinje suglasnikom)" },
        { sentence: "___ egg (Donald makes breakfast)", answer: "an", hint: "(počinje samoglasnikom)" },
        { sentence: "___ pencil (for drawing Mickey)", answer: "a", hint: "(počinje suglasnikom)" },
        { sentence: "___ ice cream (Minnie loves it)", answer: "an", hint: "(počinje samoglasnikom)" },
        { sentence: "___ bow (Minnie's pink bow)", answer: "a", hint: "(počinje suglasnikom)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: 'Stavi "a" ili "an" ispred imenice. ⭐ Hint: an + samoglasnik (a, e, i, o, u), a + suglasnik!',
        wordBank: ["a", "an"],
        items: pool.map(p => ({ sentence: p.sentence, answer: p.answer, hint: p.hint })),
      };
    },
  },

  // ── Grade 3 ──────────────────────────────────────────────────────────────

  sports: {
    supportedTypes: ["match", "tf"],
    generate(count, taskType) {
      const pairs = shuffle([
        { en: "football", sr: "fudbal" },
        { en: "basketball", sr: "košarka" },
        { en: "tennis", sr: "tenis" },
        { en: "swimming", sr: "plivanje" },
        { en: "cycling", sr: "biciklizam" },
        { en: "running", sr: "trčanje" },
        { en: "volleyball", sr: "odbojka" },
        { en: "skiing", sr: "skijanje" },
        { en: "gymnastics", sr: "gimnastika" },
        { en: "boxing", sr: "boks" },
      ]).slice(0, Math.min(count, 10));
      if (taskType === "tf") return makeTFFromPairs(pairs, count);
      return {
        type: "match",
        instruction: "Povezi sport na engleskom sa prevodom na srpski.",
        pairs,
        leftLabel: "English",
        rightLabel: "Srpski",
      };
    },
  },

  clothes: {
    supportedTypes: ["match", "tf"],
    generate(count, taskType) {
      const pairs = shuffle([
        { en: "shirt", sr: "košulja" },
        { en: "trousers", sr: "pantalone" },
        { en: "dress", sr: "haljina" },
        { en: "jacket", sr: "jakna" },
        { en: "hat", sr: "šešir/kapa" },
        { en: "shoes", sr: "cipele" },
        { en: "socks", sr: "čarape" },
        { en: "skirt", sr: "suknja" },
        { en: "coat", sr: "kaput" },
        { en: "scarf", sr: "šal" },
        { en: "gloves", sr: "rukavice" },
        { en: "boots", sr: "čizme" },
      ]).slice(0, Math.min(count, 12));
      if (taskType === "tf") return makeTFFromPairs(pairs, count);
      return {
        type: "match",
        instruction: "Povezi odevni predmet na engleskom sa prevodom.",
        pairs,
        leftLabel: "English",
        rightLabel: "Srpski",
      };
    },
  },

  adjectives: {
    supportedTypes: ["match", "tf"],
    generate(count, taskType) {
      const allPairs = shuffle([
        { en: "big", sr: "small" },
        { en: "hot", sr: "cold" },
        { en: "tall", sr: "short" },
        { en: "fast", sr: "slow" },
        { en: "old", sr: "young" },
        { en: "happy", sr: "sad" },
        { en: "good", sr: "bad" },
        { en: "long", sr: "short" },
        { en: "hard", sr: "easy" },
        { en: "clean", sr: "dirty" },
        { en: "heavy", sr: "light" },
        { en: "full", sr: "empty" },
      ]).slice(0, Math.min(count, 12));
      if (taskType === "tf") {
        const allSr = allPairs.map(p => p.sr);
        const targetCorrect = Math.round(allPairs.length / 2);
        const correctIdx = new Set(shuffle([...Array(allPairs.length).keys()]).slice(0, targetCorrect));
        return {
          type: "tf",
          instruction: "Zaokruži TRUE ako su pridevi suprotnog značenja, FALSE ako nisu.",
          items: allPairs.map((p, i) => {
            if (correctIdx.has(i)) return { sentence: `"${p.en}" ↔ "${p.sr}"`, answer: true };
            const wrong = shuffle(allSr.filter(s => s !== p.sr))[0] || p.sr;
            return { sentence: `"${p.en}" ↔ "${wrong}"`, answer: wrong === p.sr };
          }),
        };
      }
      return {
        type: "match",
        instruction: "Povezi pridev sa suprotnim pojmom (antonimom).",
        pairs: allPairs,
        leftLabel: "Pridev",
        rightLabel: "Suprotan pojam",
      };
    },
  },

  prepositions: {
    generate(count) {
      const pool = shuffle([
        { sentence: "Mickey is ___ the clubhouse.", answer: "in", hint: "(unutra)" },
        { sentence: "Minnie's bow is ___ the table.", answer: "on", hint: "(na)" },
        { sentence: "Pluto is ___ the chair.", answer: "under", hint: "(ispod)" },
        { sentence: "Goofy is ___ Mickey.", answer: "next to", hint: "(pored)" },
        { sentence: "Daisy is ___ the door.", answer: "behind", hint: "(iza)" },
        { sentence: "Donald's hat is ___ the box.", answer: "in", hint: "(unutra)" },
        { sentence: "Minnie is ___ the sofa.", answer: "on", hint: "(na)" },
        { sentence: "Mickey is ___ the bed.", answer: "under", hint: "(ispod)" },
        { sentence: "Pluto is ___ Donald.", answer: "next to", hint: "(pored)" },
        { sentence: "Goofy is ___ the car.", answer: "behind", hint: "(iza)" },
        { sentence: "The ball is ___ Mickey's bag.", answer: "in", hint: "(unutra)" },
        { sentence: "Donald's book is ___ the desk.", answer: "on", hint: "(na)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: "Gde su Mickey i prijatelji? Popuni predlog mesta. 🏠",
        wordBank: ["in", "on", "under", "next to", "behind"],
        items: pool,
      };
    },
  },

  present_simple_3rd: {
    generate(count) {
      const pool = shuffle([
        { sentence: "Minnie ___ (play) with her friends every day.", answer: "plays", base: "play" },
        { sentence: "Mickey ___ (go) to the clubhouse by car.", answer: "goes", base: "go" },
        { sentence: "Daisy ___ (watch) TV after school.", answer: "watches", base: "watch" },
        { sentence: "Goofy ___ (have) a big hat.", answer: "has", base: "have" },
        { sentence: "Minnie ___ (like) pink bows.", answer: "likes", base: "like" },
        { sentence: "Donald ___ (do) his homework every evening.", answer: "does", base: "do" },
        { sentence: "Daisy ___ (read) books in her free time.", answer: "reads", base: "read" },
        { sentence: "Mickey ___ (eat) breakfast at 7 o'clock.", answer: "eats", base: "eat" },
        { sentence: "Minnie ___ (live) in a pretty house.", answer: "lives", base: "live" },
        { sentence: "Donald ___ (teach) his friends to swim.", answer: "teaches", base: "teach" },
        { sentence: "Daisy ___ (study) every afternoon.", answer: "studies", base: "study" },
        { sentence: "Goofy ___ (swim) on Saturdays.", answer: "swims", base: "swim" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: "Stavi glagol u odgovarajući oblik (3. lice jednine). ⭐ Mickey i prijatelji uče Present Simple!",
        wordBank: pool.map(p => p.base),
        items: pool.map(p => ({ sentence: p.sentence, answer: p.answer })),
      };
    },
  },

  // ── Grade 4 ──────────────────────────────────────────────────────────────

  comparatives: {
    generate(count) {
      const all = shuffle([
        { en: "big", sr: "bigger" },
        { en: "small", sr: "smaller" },
        { en: "tall", sr: "taller" },
        { en: "fast", sr: "faster" },
        { en: "old", sr: "older" },
        { en: "long", sr: "longer" },
        { en: "hot", sr: "hotter" },
        { en: "cold", sr: "colder" },
        { en: "good", sr: "better" },
        { en: "bad", sr: "worse" },
        { en: "expensive", sr: "more expensive" },
        { en: "difficult", sr: "more difficult" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "match",
        instruction: "Povezi pridev sa komparativom (stepenom poređenja).",
        pairs: all,
        leftLabel: "Pridev",
        rightLabel: "Komparativ",
      };
    },
  },

  have_has: {
    generate(count) {
      const pool = shuffle([
        { sentence: "I ___ a dog.", answer: "have", hint: "(I)" },
        { sentence: "She ___ a cat.", answer: "has", hint: "(She)" },
        { sentence: "He ___ a new bike.", answer: "has", hint: "(He)" },
        { sentence: "We ___ two brothers.", answer: "have", hint: "(We)" },
        { sentence: "They ___ a big garden.", answer: "have", hint: "(They)" },
        { sentence: "It ___ long ears.", answer: "has", hint: "(It)" },
        { sentence: "You ___ a great idea.", answer: "have", hint: "(You)" },
        { sentence: "My mother ___ brown eyes.", answer: "has", hint: "(My mother)" },
        { sentence: "The children ___ a lot of toys.", answer: "have", hint: "(The children)" },
        { sentence: "The cat ___ a long tail.", answer: "has", hint: "(The cat)" },
        { sentence: "I ___ breakfast at 7 o'clock.", answer: "have", hint: "(I)" },
        { sentence: "She ___ a lesson today.", answer: "has", hint: "(She)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: 'Popuni rečenicu sa "have" ili "has".',
        wordBank: ["have", "has"],
        items: pool,
      };
    },
  },

  plurals: {
    generate(count) {
      const all = shuffle([
        { en: "cat", sr: "cats" },
        { en: "dog", sr: "dogs" },
        { en: "box", sr: "boxes" },
        { en: "bus", sr: "buses" },
        { en: "city", sr: "cities" },
        { en: "baby", sr: "babies" },
        { en: "child", sr: "children" },
        { en: "man", sr: "men" },
        { en: "woman", sr: "women" },
        { en: "tooth", sr: "teeth" },
        { en: "foot", sr: "feet" },
        { en: "mouse", sr: "mice" },
        { en: "class", sr: "classes" },
        { en: "dish", sr: "dishes" },
        { en: "story", sr: "stories" },
      ]).slice(0, Math.min(count, 15));
      return {
        type: "match",
        instruction: "Povezi imenicu u jednini sa oblikom množine.",
        pairs: all,
        leftLabel: "Jednina (singular)",
        rightLabel: "Množina (plural)",
      };
    },
  },

  do_does: {
    generate(count) {
      const pool = shuffle([
        { sentence: "___ you like pizza?", answer: "Do", hint: "(you)" },
        { sentence: "___ she play football?", answer: "Does", hint: "(she)" },
        { sentence: "___ they live in London?", answer: "Do", hint: "(they)" },
        { sentence: "___ he have a dog?", answer: "Does", hint: "(he)" },
        { sentence: "___ we need an umbrella?", answer: "Do", hint: "(we)" },
        { sentence: "___ it eat meat?", answer: "Does", hint: "(it)" },
        { sentence: "___ your parents work here?", answer: "Do", hint: "(your parents)" },
        { sentence: "___ she speak English?", answer: "Does", hint: "(she)" },
        { sentence: "___ you go to school by bus?", answer: "Do", hint: "(you)" },
        { sentence: "___ the teacher give homework?", answer: "Does", hint: "(the teacher)" },
        { sentence: "___ he like reading?", answer: "Does", hint: "(he)" },
        { sentence: "___ they play basketball?", answer: "Do", hint: "(they)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: 'Napiši "Do" ili "Does" na početku pitanja u sadašnjem vremenu.',
        wordBank: ["Do", "Does"],
        items: pool,
      };
    },
  },

  // ── Grade 5 ──────────────────────────────────────────────────────────────

  past_simple_regular: {
    generate(count) {
      const pool = shuffle([
        { base: "walk", past: "walked", sentence: "She ___ to school yesterday.", answer: "walked" },
        { base: "play", past: "played", sentence: "They ___ football last Sunday.", answer: "played" },
        { base: "watch", past: "watched", sentence: "We ___ a movie last night.", answer: "watched" },
        { base: "talk", past: "talked", sentence: "He ___ to his teacher.", answer: "talked" },
        { base: "cook", past: "cooked", sentence: "My mother ___ dinner.", answer: "cooked" },
        { base: "clean", past: "cleaned", sentence: "I ___ my room.", answer: "cleaned" },
        { base: "visit", past: "visited", sentence: "We ___ our grandparents.", answer: "visited" },
        { base: "listen", past: "listened", sentence: "She ___ to music.", answer: "listened" },
        { base: "open", past: "opened", sentence: "He ___ the window.", answer: "opened" },
        { base: "close", past: "closed", sentence: "She ___ the door.", answer: "closed" },
        { base: "finish", past: "finished", sentence: "They ___ the game.", answer: "finished" },
        { base: "help", past: "helped", sentence: "I ___ my friend.", answer: "helped" },
        { base: "jump", past: "jumped", sentence: "The dog ___ over the fence.", answer: "jumped" },
        { base: "call", past: "called", sentence: "She ___ her mother.", answer: "called" },
        { base: "ask", past: "asked", sentence: "He ___ a question.", answer: "asked" },
      ]).slice(0, Math.min(count, 15));
      return {
        type: "fillin",
        instruction: "Stavi glagol u Past Simple (pravilni glagoli dodaju -ed).",
        wordBank: pool.map(p => p.base),
        items: pool.map(p => ({ sentence: p.sentence, answer: p.answer, hint: `(${p.base})` })),
      };
    },
  },

  past_simple_irregular: {
    generate(count) {
      const all = [
        { base: "go", past: "went" }, { base: "come", past: "came" },
        { base: "see", past: "saw" }, { base: "eat", past: "ate" },
        { base: "drink", past: "drank" }, { base: "buy", past: "bought" },
        { base: "take", past: "took" }, { base: "give", past: "gave" },
        { base: "make", past: "made" }, { base: "have", past: "had" },
        { base: "do", past: "did" }, { base: "say", past: "said" },
        { base: "get", past: "got" }, { base: "run", past: "ran" },
        { base: "write", past: "wrote" }, { base: "read", past: "read" },
        { base: "swim", past: "swam" }, { base: "sing", past: "sang" },
        { base: "sleep", past: "slept" }, { base: "wake", past: "woke" },
      ];
      const selected = shuffle(all).slice(0, Math.min(count, 20));
      return {
        type: "match",
        instruction: "Povezi glagol u infinitivu sa oblikom Past Simple.",
        pairs: selected.map(v => ({ en: v.base, sr: v.past })),
        leftLabel: "Infinitive",
        rightLabel: "Past Simple",
      };
    },
  },

  past_simple_negative: {
    generate(count) {
      const pool = shuffle([
        { sentence: "She ___ (not/go) to school yesterday.", answer: "didn't go" },
        { sentence: "They ___ (not/watch) TV last night.", answer: "didn't watch" },
        { sentence: "He ___ (not/eat) breakfast.", answer: "didn't eat" },
        { sentence: "I ___ (not/finish) my homework.", answer: "didn't finish" },
        { sentence: "We ___ (not/play) football.", answer: "didn't play" },
        { sentence: "She ___ (not/call) me.", answer: "didn't call" },
        { sentence: "They ___ (not/come) to the party.", answer: "didn't come" },
        { sentence: "He ___ (not/buy) a new book.", answer: "didn't buy" },
        { sentence: "I ___ (not/sleep) well.", answer: "didn't sleep" },
        { sentence: "We ___ (not/see) the movie.", answer: "didn't see" },
        { sentence: "She ___ (not/make) a cake.", answer: "didn't make" },
        { sentence: "He ___ (not/run) in the park.", answer: "didn't run" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: "Napiši negaciju u Past Simple koristeći didn't + glagol.",
        wordBank: ["didn't"],
        items: pool,
      };
    },
  },

  // ── Grade 6 ──────────────────────────────────────────────────────────────

  past_simple_questions: {
    generate(count) {
      const pool = shuffle([
        { sentence: "___ she go to school yesterday?", answer: "Did", hint: "(she / go)" },
        { sentence: "___ they play football?", answer: "Did", hint: "(they / play)" },
        { sentence: "___ he eat breakfast?", answer: "Did", hint: "(he / eat)" },
        { sentence: "___ you finish your homework?", answer: "Did", hint: "(you / finish)" },
        { sentence: "___ we see that movie?", answer: "Did", hint: "(we / see)" },
        { sentence: "___ she call you?", answer: "Did", hint: "(she / call)" },
        { sentence: "___ they come to the party?", answer: "Did", hint: "(they / come)" },
        { sentence: "___ he buy a new phone?", answer: "Did", hint: "(he / buy)" },
        { sentence: "___ it rain yesterday?", answer: "Did", hint: "(it / rain)" },
        { sentence: "___ you walk to school?", answer: "Did", hint: "(you / walk)" },
      ]).slice(0, Math.min(count, 10));
      return {
        type: "fillin",
        instruction: "Napiši pitanje u Past Simple — stavi 'Did' na početak rečenice.",
        wordBank: ["Did"],
        items: pool,
      };
    },
  },

  past_simple_mixed: {
    generate(count) {
      const sentences = shuffle([
        { sentence: "Yesterday I ___ (go) to the park.", answer: "went", hint: "(nepravilan)" },
        { sentence: "She ___ (cook) dinner last night.", answer: "cooked", hint: "(pravilan)" },
        { sentence: "They ___ (not/watch) TV.", answer: "didn't watch", hint: "(negacija)" },
        { sentence: "___ he (play) football?", answer: "Did he play", hint: "(pitanje)" },
        { sentence: "We ___ (see) a great film.", answer: "saw", hint: "(nepravilan)" },
        { sentence: "I ___ (clean) my room.", answer: "cleaned", hint: "(pravilan)" },
        { sentence: "She ___ (not/come) to school.", answer: "didn't come", hint: "(negacija)" },
        { sentence: "___ they (eat) lunch?", answer: "Did they eat", hint: "(pitanje)" },
        { sentence: "He ___ (run) very fast.", answer: "ran", hint: "(nepravilan)" },
        { sentence: "We ___ (visit) our friends.", answer: "visited", hint: "(pravilan)" },
        { sentence: "I ___ (not/finish) the test.", answer: "didn't finish", hint: "(negacija)" },
        { sentence: "___ she (buy) a new bag?", answer: "Did she buy", hint: "(pitanje)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: "Stavi glagol u odgovarajući oblik Past Simple (potvrdno, negativno ili pitanje).",
        wordBank: [],
        items: sentences,
      };
    },
  },

  alphabet: {
    generate(count) {
      const letterEmojis = {
        A:"🍎", B:"🐝", C:"🐱", D:"🐶", E:"🐘", F:"🐸",
        G:"🦒", H:"🏠", I:"🍦", J:"🃏", K:"🦘", L:"🦁",
        M:"🐭", N:"👃", O:"🍊", P:"🐧", Q:"👸", R:"🌈",
        S:"⭐", T:"🐯", U:"☂️", V:"🌋", W:"🐋", X:"❌",
        Y:"🪀", Z:"🦓",
      };
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      const selected = shuffle(letters).slice(0, Math.min(count, 16));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže slovo na engleskom. Zaokruži odgovarajuće slovo! 🔤",
        teacherNote: "Izgovorite naziv slova na engleskom 2–3 puta (npr. 'EY' za A). Deca zaokružuju slovo.",
        items: selected.map(l => ({ word: l, emoji: letterEmojis[l], sr: "" })),
      };
    },
  },
};

// ─── RENDER HELPERS ───────────────────────────────────────────────────────────

// ─── AUTH ─────────────────────────────────────────────────────────────────────

const ROLE_META = {
  teacher:    { label: "Teacher",     icon: "👩‍🏫" },
  school:     { label: "School",      icon: "🏫"   },
  superadmin: { label: "Super Admin", icon: "🔑"   },
};

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(pw) {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Must contain at least one lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Must contain at least one number.";
  if (!/[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/.test(pw)) return "Must contain at least one special character (!@#$…).";
  return null;
}

const normalizeProfile = (p) => ({
  ...p,
  firstName: p?.first_name || '',
  lastName:  p?.last_name  || '',
  middleName: p?.middle_name || '',
});

async function fetchProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data ? normalizeProfile(data) : null;
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm({ onLogin, onSwitchToSignup, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!validateEmail(email)) e.email = "Please enter a valid email address.";
    if (!password.trim()) e.password = "Please enter your password.";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitted(true);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setGlobalError("Incorrect email or password.");
      setLoading(false);
      return;
    }
    const profile = await fetchProfile(data.user.id);
    if (!profile) {
      setGlobalError("Profile not found. Contact your administrator.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    if (profile.status && profile.status !== 'active') {
      setGlobalError(
        profile.status === 'pending'
          ? "Your account is pending. Check your email to set your password."
          : "Your account has been deactivated. Contact your school administrator."
      );
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    setLoading(false);
    onLogin({ ...data.user, ...profile });
  };

  const err = (f) => submitted && errors[f] ? { borderColor: "#ff6b6b", boxShadow: "0 0 0 3px rgba(224,49,49,0.1)" } : {};

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {globalError && <div className="auth-alert">{globalError}</div>}
      <div className="auth-field">
        <label>Email address</label>
        <input className="text-input" type="email" placeholder="your@email.com" value={email}
          onChange={e => { setEmail(e.target.value); setGlobalError(""); }} style={err("email")} />
        {submitted && errors.email && <span className="auth-error">{errors.email}</span>}
      </div>
      <div className="auth-field">
        <label>Password</label>
        <input className="text-input" type="password" placeholder="Your password" value={password}
          onChange={e => { setPassword(e.target.value); setGlobalError(""); }} style={err("password")} />
        {submitted && errors.password && <span className="auth-error">{errors.password}</span>}
      </div>
      <button type="submit" className="gen-btn" style={{ marginTop: 6 }} disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p style={{ textAlign: "center", fontSize: 13, color: "#9b7060", margin: 0 }}>
        <button type="button" onClick={onForgotPassword}
          style={{ background: "none", border: "none", color: "#9b7060", cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" }}>
          Forgot password?
        </button>
      </p>
      <p style={{ textAlign: "center", fontSize: 14, color: "#9b7060", margin: 0 }}>
        Don't have an account?{" "}
        <button type="button" onClick={onSwitchToSignup}
          style={{ background: "none", border: "none", color: "#f76707", fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0 }}>
          Sign up
        </button>
      </p>
    </form>
  );
}

// ─── Signup Form ──────────────────────────────────────────────────────────────

function SignupForm({ onSignup, onSwitchToLogin }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", middleName: "",
    email: "", password: "", confirmPassword: "", role: "",
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [awaitConfirm, setAwaitConfirm] = useState(false);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim() || form.firstName.trim().length < 2)
      e.firstName = "First name must be at least 2 characters.";
    if (!form.lastName.trim() || form.lastName.trim().length < 2)
      e.lastName = "Last name must be at least 2 characters.";
    if (!validateEmail(form.email))
      e.email = "Please enter a valid email address.";
    const pwErr = validatePassword(form.password);
    if (pwErr) e.password = pwErr;
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    if (!form.role)
      e.role = "Please select a role.";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitted(true);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name:  form.firstName.trim(),
          last_name:   form.lastName.trim(),
          middle_name: form.middleName.trim(),
          role:        form.role,
        }
      }
    });
    if (error) {
      setGlobalError(
        error.message.toLowerCase().includes('already registered')
          ? "This email address is already registered."
          : error.message
      );
      setLoading(false);
      return;
    }
    if (!data.session) {
      setLoading(false);
      setAwaitConfirm(true);
      return;
    }
    // Wait for DB trigger to create the profile row
    let profile = null;
    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 350));
      profile = await fetchProfile(data.user.id);
      if (profile) break;
    }
    setLoading(false);
    onSignup({ ...data.user, ...(profile || normalizeProfile({ first_name: form.firstName.trim(), last_name: form.lastName.trim(), middle_name: form.middleName.trim(), role: form.role })) });
  };

  const err = (f) => submitted && errors[f] ? { borderColor: "#ff6b6b", boxShadow: "0 0 0 3px rgba(224,49,49,0.1)" } : {};

  if (awaitConfirm) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 900, color: "#2d1b0e", marginBottom: 8 }}>
          Confirm your email address
        </div>
        <p style={{ fontSize: 14, color: "#9b7060", lineHeight: 1.6 }}>
          We've sent a link to <strong>{form.email}</strong>.<br />
          Click the link in the email to complete your registration.
        </p>
        <button className="mini-btn ghost" style={{ marginTop: 20 }} onClick={() => setAwaitConfirm(false)}>
          Back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {globalError && <div className="auth-alert">{globalError}</div>}
      <div className="input-row-2">
        <div className="auth-field">
          <label>First Name *</label>
          <input className="text-input" placeholder="e.g. Jane" value={form.firstName} onChange={set("firstName")} style={err("firstName")} />
          {submitted && errors.firstName && <span className="auth-error">{errors.firstName}</span>}
        </div>
        <div className="auth-field">
          <label>Last Name *</label>
          <input className="text-input" placeholder="e.g. Smith" value={form.lastName} onChange={set("lastName")} style={err("lastName")} />
          {submitted && errors.lastName && <span className="auth-error">{errors.lastName}</span>}
        </div>
      </div>
      <div className="auth-field">
        <label>Middle Name <span style={{ color: "#c4a498", fontWeight: 500 }}>(optional)</span></label>
        <input className="text-input" placeholder="Not required" value={form.middleName} onChange={set("middleName")} />
      </div>
      <div className="auth-field">
        <label>Email Address *</label>
        <input className="text-input" type="email" placeholder="your@email.com" value={form.email}
          onChange={e => { set("email")(e); setGlobalError(""); }} style={err("email")} />
        {submitted && errors.email && <span className="auth-error">{errors.email}</span>}
      </div>
      <div className="auth-field">
        <label>Password *</label>
        <input className="text-input" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={set("password")} style={err("password")} />
        {submitted && errors.password && <span className="auth-error">{errors.password}</span>}
        <span className="auth-hint">Must include: uppercase, lowercase, number, special character (!@#$…)</span>
      </div>
      <div className="auth-field">
        <label>Confirm Password *</label>
        <input className="text-input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set("confirmPassword")} style={err("confirmPassword")} />
        {submitted && errors.confirmPassword && <span className="auth-error">{errors.confirmPassword}</span>}
      </div>
      <div className="auth-field">
        <label>Role *</label>
        <div className="role-cards">
          {[
            { value: "teacher", icon: "👩‍🏫", label: "Teacher", desc: "Individual teacher" },
            { value: "school",  icon: "🏫",   label: "School",  desc: "Educational institution" },
          ].map(r => (
            <button key={r.value} type="button"
              className={`role-card ${form.role === r.value ? "active" : ""}`}
              onClick={() => setForm(prev => ({ ...prev, role: r.value }))}>
              <span className="role-icon">{r.icon}</span>
              <span className="role-label">{r.label}</span>
              <span className="role-desc">{r.desc}</span>
            </button>
          ))}
        </div>
        {submitted && errors.role && <span className="auth-error">{errors.role}</span>}
      </div>
      <button type="submit" className="gen-btn" style={{ marginTop: 4 }} disabled={loading}>
        {loading ? "Registering…" : "Sign up"}
      </button>
      <p style={{ textAlign: "center", fontSize: 14, color: "#9b7060", margin: 0 }}>
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin}
          style={{ background: "none", border: "none", color: "#f76707", fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0 }}>
          Sign in
        </button>
      </p>
    </form>
  );
}

// ─── Forgot Password Form ─────────────────────────────────────────────────────

function ForgotPasswordForm({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateEmail(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 900, color: "#2d1b0e", marginBottom: 8 }}>
          Check your email
        </div>
        <p style={{ fontSize: 14, color: "#9b7060", lineHeight: 1.6 }}>
          We've sent a reset link to <strong>{email}</strong>.
        </p>
        <button className="mini-btn ghost" style={{ marginTop: 20 }} onClick={onBack}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && <div className="auth-alert">{error}</div>}
      <div className="auth-field">
        <label>Email address</label>
        <input className="text-input" type="email" placeholder="your@email.com" value={email}
          onChange={e => { setEmail(e.target.value); setError(""); }} />
      </div>
      <button type="submit" className="gen-btn" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </button>
      <p style={{ textAlign: "center", fontSize: 14, color: "#9b7060", margin: 0 }}>
        <button type="button" onClick={onBack}
          style={{ background: "none", border: "none", color: "#f76707", fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0 }}>
          Back to sign in
        </button>
      </p>
    </form>
  );
}

// ─── Reset Password Form ──────────────────────────────────────────────────────

function ResetPasswordForm({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    // Activate the account if this was an invited teacher accepting their invite.
    try { await supabase.rpc('activate_my_account'); } catch (_) { /* no-op for normal recovery */ }
    setSuccess(true);
    setTimeout(onDone, 2000);
  };

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 900, color: "#2d1b0e" }}>
          Password updated!
        </div>
        <p style={{ fontSize: 14, color: "#9b7060", marginTop: 8 }}>Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && <div className="auth-alert">{error}</div>}
      <div className="auth-field">
        <label>New Password</label>
        <input className="text-input" type="password" placeholder="Minimum 8 characters"
          value={password} onChange={e => { setPassword(e.target.value); setError(""); }} />
        <span className="auth-hint">Must include: uppercase, lowercase, number, special character (!@#$…)</span>
      </div>
      <div className="auth-field">
        <label>Confirm New Password</label>
        <input className="text-input" type="password" placeholder="Repeat password"
          value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(""); }} />
      </div>
      <button type="submit" className="gen-btn" disabled={loading}>
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────

function AuthScreen({ onLogin }) {
  const [view, setView] = useState("login");
  const subtitle = view === "login" ? "Welcome! Sign in to continue."
    : view === "signup" ? "Create a new account"
    : "Reset your password";
  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <Logo variant="icon" size={62} className="auth-logo" />
        <div className="auth-title">ESLtopia</div>
        <div className="auth-subtitle">{subtitle}</div>
        {view === "login" && <LoginForm onLogin={onLogin} onSwitchToSignup={() => setView("signup")} onForgotPassword={() => setView("forgot")} />}
        {view === "signup" && <SignupForm onSignup={onLogin} onSwitchToLogin={() => setView("login")} />}
        {view === "forgot" && <ForgotPasswordForm onBack={() => setView("login")} />}
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

function AdminPanel({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at')
      .then(({ data }) => {
        if (data) setUsers(data.map(normalizeProfile));
        setAdminLoading(false);
      });
  }, []);

  const changeRole = async (userId, newRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const deleteUser = async (userId) => {
    if (userId === currentUser.id) return;
    if (!window.confirm("Delete this user? Their data will be retained for reporting.")) return;
    const deletedAt = new Date().toISOString();
    const { error } = await supabase.from('profiles').update({ deleted_at: deletedAt }).eq('id', userId);
    if (!error) setUsers(prev => prev.map(u => u.id === userId ? { ...u, deleted_at: deletedAt } : u));
  };

  const restoreUser = async (userId) => {
    const { error } = await supabase.from('profiles').update({ deleted_at: null }).eq('id', userId);
    if (!error) setUsers(prev => prev.map(u => u.id === userId ? { ...u, deleted_at: null } : u));
  };

  if (adminLoading) {
    return (
      <div className="classes-panel">
        <div className="config-title">Admin panel</div>
        <div className="empty-state"><div className="empty-state-text">Loading users…</div></div>
      </div>
    );
  }

  const totalRegistered = users.length;
  const activeCount  = users.filter(u => !u.deleted_at && u.status === 'active').length;
  const pendingCount = users.filter(u => !u.deleted_at && u.status === 'pending').length;
  const inactiveCount = users.filter(u => !u.deleted_at && u.status === 'inactive').length;
  const deletedCount = users.filter(u => u.deleted_at).length;

  const dailyMap = {};
  users.forEach(u => {
    const day = u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB') : 'Unknown';
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  });
  const dailyRows = Object.entries(dailyMap).sort((a, b) => {
    const parse = s => { const [d, m, y] = s.split('/'); return new Date(`${y}-${m}-${d}`); };
    return parse(b[0]) - parse(a[0]);
  });

  return (
    <div className="classes-panel">
      <div className="config-title">Admin panel — Overview</div>

      {/* ── Summary stats ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          { label: "Total registered", value: totalRegistered, color: "#2d1b0e" },
          { label: "Active",           value: activeCount,     color: "#2b8a3e" },
          { label: "Pending",          value: pendingCount,    color: "#e67700" },
          { label: "Inactive",         value: inactiveCount,   color: "#9b7060" },
          { label: "Deleted",          value: deletedCount,    color: "#c92a2a" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "#fff8f5", border: "1px solid #f0ddd5", borderRadius: 10,
            padding: "10px 18px", minWidth: 100, textAlign: "center",
          }}>
            <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "'Nunito', sans-serif" }}>{value}</div>
            <div style={{ fontSize: 11, color: "#9b7060", fontWeight: 700, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Daily registrations ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#2d1b0e", marginBottom: 8, fontFamily: "'Nunito', sans-serif" }}>
          Daily registrations
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {dailyRows.map(([date, count]) => (
              <tr key={date}>
                <td style={{ fontSize: 13, color: "#9b7060" }}>{date}</td>
                <td style={{ fontSize: 13, fontWeight: 800, color: "#2d1b0e" }}>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── User management ── */}
      <div style={{ fontSize: 13, fontWeight: 800, color: "#2d1b0e", marginBottom: 8, fontFamily: "'Nunito', sans-serif" }}>
        User management
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Registered</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const isDeleted = !!u.deleted_at;
            return (
              <tr key={u.id} style={{ opacity: isDeleted ? 0.5 : 1 }}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: isDeleted
                        ? "#e9ecef"
                        : "linear-gradient(135deg, #f76707 0%, #e64980 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isDeleted ? "#adb5bd" : "#fff",
                      fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 900, flexShrink: 0,
                    }}>
                      {(u.firstName?.[0] || "") + (u.lastName?.[0] || "")}
                    </div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14, color: isDeleted ? "#adb5bd" : "#2d1b0e" }}>
                      {u.firstName} {u.middleName ? u.middleName + " " : ""}{u.lastName}
                      {u.id === currentUser.id && (
                        <span style={{ marginLeft: 6, fontSize: 10, background: "#ebfbee", color: "#2b8a3e", fontWeight: 700, borderRadius: 5, padding: "1px 7px" }}>You</span>
                      )}
                      {isDeleted && (
                        <span style={{ marginLeft: 6, fontSize: 10, background: "#fff0f0", color: "#c92a2a", fontWeight: 700, borderRadius: 5, padding: "1px 7px" }}>Deleted</span>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 13, color: "#9b7060" }}>{u.email}</td>
                <td>
                  <select
                    className="grade-select"
                    style={{ width: 120, fontSize: 12, textAlign: "left" }}
                    value={u.role}
                    onChange={e => changeRole(u.id, e.target.value)}
                    disabled={isDeleted || (u.id === currentUser.id && u.role === 'superadmin')}
                  >
                    <option value="teacher">Teacher</option>
                    <option value="school">School</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </td>
                <td style={{ fontSize: 12, color: "#9b7060" }}>{isDeleted ? "—" : (u.status || "active")}</td>
                <td style={{ fontSize: 12, color: "#c4a498" }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("en-GB") : "—"}
                </td>
                <td>
                  {u.id !== currentUser.id && (
                    isDeleted
                      ? <button className="delete-class-btn" style={{ color: "#2b8a3e" }} onClick={() => restoreUser(u.id)}>Restore</button>
                      : <button className="delete-class-btn" style={{ color: "#ff6b6b" }} onClick={() => deleteUser(u.id)}>Delete</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Employees Panel (School) ──────────────────────────────────────────────────

function EmployeesPanel({ currentUser }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: "", lastName: "", middleName: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', currentUser.id)
      .order('created_at');
    setTeachers((data || []).map(normalizeProfile));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

  const addTeacher = async (ev) => {
    ev.preventDefault();
    setError(""); setNotice("");
    if (!form.firstName.trim() || !form.lastName.trim() || !validateEmail(form.email)) {
      setError("First name, last name and a valid email are required.");
      return;
    }
    setBusy(true);
    const { data, error: fnErr } = await supabase.functions.invoke('create-teacher', {
      body: {
        email: form.email.trim().toLowerCase(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim(),
      },
    });
    setBusy(false);
    if (fnErr || data?.error) {
      setError(data?.error || fnErr?.message || "Could not add teacher.");
      return;
    }
    setNotice(`Invitation sent to ${form.email.trim().toLowerCase()}.`);
    setForm({ firstName: "", lastName: "", middleName: "", email: "" });
    load();
  };

  const manage = async (teacherId, action) => {
    if (action === 'remove' && !window.confirm("Remove this teacher? This permanently deletes their account.")) return;
    setError(""); setNotice("");
    const { data, error: fnErr } = await supabase.functions.invoke('manage-teacher', {
      body: { teacherId, action },
    });
    if (fnErr || data?.error) {
      setError(data?.error || fnErr?.message || "Action failed.");
      return;
    }
    load();
  };

  const statusBadge = (status) => {
    const map = {
      pending:  { bg: "#fff9db", color: "#b08900", label: "Pending" },
      active:   { bg: "#ebfbee", color: "#2b8a3e", label: "Active" },
      inactive: { bg: "#fff0f0", color: "#e03131", label: "Inactive" },
    };
    const s = map[status] || map.active;
    return <span style={{ fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, borderRadius: 6, padding: "2px 8px" }}>{s.label}</span>;
  };

  return (
    <div className="classes-panel">
      <div className="config-title">Employees — Teacher management</div>
      <p style={{ fontSize: 13, color: "#9b7060", marginBottom: 16 }}>
        Add teachers employed at your school. They receive an email to set their password; until then they show as <strong>Pending</strong>.
      </p>

      <form onSubmit={addTeacher} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end", marginBottom: 20 }}>
        <div className="auth-field" style={{ flex: "1 1 130px" }}>
          <label>First name *</label>
          <input className="text-input" placeholder="e.g. Jane" value={form.firstName} onChange={set("firstName")} />
        </div>
        <div className="auth-field" style={{ flex: "1 1 130px" }}>
          <label>Last name *</label>
          <input className="text-input" placeholder="e.g. Smith" value={form.lastName} onChange={set("lastName")} />
        </div>
        <div className="auth-field" style={{ flex: "1 1 180px" }}>
          <label>Email *</label>
          <input className="text-input" type="email" placeholder="teacher@email.com" value={form.email} onChange={set("email")} />
        </div>
        <button type="submit" className="gen-btn" style={{ flex: "0 0 auto" }} disabled={busy}>
          {busy ? "Adding…" : "Add teacher"}
        </button>
      </form>

      {error && <div className="auth-alert" style={{ marginBottom: 14 }}>{error}</div>}
      {notice && <div style={{ marginBottom: 14, background: "#ebfbee", color: "#2b8a3e", borderRadius: 8, padding: "10px 14px", fontSize: 14 }}>{notice}</div>}

      {loading ? (
        <div className="empty-state"><div className="empty-state-text">Loading teachers…</div></div>
      ) : teachers.length === 0 ? (
        <div className="empty-state"><div className="empty-state-text">No teachers yet. Add your first one above.</div></div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Teacher</th><th>Email</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id}>
                <td style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14, color: "#2d1b0e" }}>
                  {t.firstName} {t.middleName ? t.middleName + " " : ""}{t.lastName}
                </td>
                <td style={{ fontSize: 13, color: "#9b7060" }}>{t.email}</td>
                <td>{statusBadge(t.status)}</td>
                <td>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    {t.status === 'inactive' ? (
                      <button className="mini-btn ghost" onClick={() => manage(t.id, 'reactivate')}>Reactivate</button>
                    ) : (
                      <button className="mini-btn ghost" onClick={() => manage(t.id, 'deactivate')}>Deactivate</button>
                    )}
                    <button className="delete-class-btn" style={{ color: "#ff6b6b" }} onClick={() => manage(t.id, 'remove')}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

function LandingPage({ onStart }) {
  return (
    <div className="landing">
      <div className="landing-hero">
        <Logo variant="icon" size={88} className="landing-logo" />
        <div className="landing-tagline">For English teachers · Grades 1–6</div>
        <h1 className="landing-title">
          English worksheets<br />
          <span className="landing-title-accent">in seconds</span>
        </h1>
        <p className="landing-subtitle">
          Choose a grade and topic, set the number of exercises, and your worksheet is ready to print. No design required, no time wasted.
        </p>
        <button className="landing-cta" onClick={onStart}>
          Get started <span style={{fontSize:20}}>→</span>
        </button>
        <div className="landing-stats">
          <div className="landing-stat">
            <div className="landing-stat-num">25+</div>
            <div className="landing-stat-label">Topics</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-num">6</div>
            <div className="landing-stat-label">Grades</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-num">3</div>
            <div className="landing-stat-label">Task types</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-num">∞</div>
            <div className="landing-stat-label">Combinations</div>
          </div>
        </div>
      </div>

      <div className="landing-features">
        <div className="feature-card">
          <span className="feature-icon">📝</span>
          <div className="feature-title">Worksheet Generator</div>
          <p className="feature-desc">Pick a topic, number of exercises, and type — tasks are generated automatically, always different.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">👥</span>
          <div className="feature-title">Class Management</div>
          <p className="feature-desc">Add classes and students. Generate personalised worksheets for each group.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">📋</span>
          <div className="feature-title">Records &amp; Grades</div>
          <p className="feature-desc">Track attendance, grades, and payments for every student — all in one place.</p>
        </div>
      </div>

      <div className="landing-grades-card">
        <div className="landing-section-label">Grade coverage</div>
        <div className="grade-pills">
          <div className="grade-pill hot">Grade 1 ⭐</div>
          <div className="grade-pill hot">Grade 2 ⭐</div>
          <div className="grade-pill hot">Grade 3 ⭐</div>
          <div className="grade-pill">Grade 4</div>
          <div className="grade-pill">Grade 5</div>
          <div className="grade-pill">Grade 6</div>
        </div>
        <p className="disney-note">
          <strong>⭐ Grades 1–3:</strong> exercises aligned with the <strong>Disney Stars &amp; Heroes</strong> textbook (Klett) — Mickey, Minnie, Donald, Goofy and friends.
        </p>
      </div>
    </div>
  );
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const TRIMESTERS = [
  { key: "t1", name: "Term 1", short: "T1", period: "September – November", months: [9, 10, 11] },
  { key: "t2", name: "Term 2", short: "T2", period: "December – February",  months: [12, 1, 2] },
  { key: "t3", name: "Term 3", short: "T3", period: "March – May",          months: [3, 4, 5] },
  { key: "t4", name: "Term 4", short: "T4", period: "June – August",        months: [6, 7, 8] },
];

const dateMonth = (dateStr) => parseInt(dateStr.split("-")[1], 10);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function EnglishGenerator() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);

  useEffect(() => {
    // An invited teacher lands on /?setup=1 — show the "set a new password" screen.
    if (new URLSearchParams(window.location.search).get('setup') === '1') {
      setPasswordReset(true);
    }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await fetchProfile(session.user.id);
        if (profile && profile.status !== 'pending' && profile.status !== 'inactive') {
          setCurrentUser({ ...session.user, ...profile });
        } else if (profile) {
          // Lingering session for a pending/deactivated account — sign it out.
          await supabase.auth.signOut();
        }
      }
      setAuthLoaded(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      } else if (event === 'PASSWORD_RECOVERY') {
        setPasswordReset(true);
      } else if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        if (!passwordReset) {
          const profile = await fetchProfile(session.user.id);
          // Don't surface pending/inactive accounts — let handleSubmit show the error
          // and call signOut. Without this guard, SIGNED_IN races with handleSubmit
          // and can unmount the login form before the error is ever visible.
          if (profile && profile.status !== 'pending' && profile.status !== 'inactive') {
            setCurrentUser({ ...session.user, ...profile });
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (user) => setCurrentUser(user);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setShowLanding(true);
    setView("generator");
  };

  const [showLanding, setShowLanding] = useState(true);
  const [view, setView] = useState("generator");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [grade, setGrade] = useState("all");
  const [count, setCount] = useState(10);
  const [tasks, setTasks] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [taskType, setTaskType] = useState("match");
  const [pdfModal, setPdfModal] = useState(false);
  const [generateKey, setGenerateKey] = useState(0);

  const [classes, setClasses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newStudentInputs, setNewStudentInputs] = useState({});

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const [records, setRecords] = useState({});
  const [recordsClassId, setRecordsClassId] = useState("");
  const todayISO = new Date().toISOString().slice(0, 10);
  const thisMonth = todayISO.slice(0, 7);
  const [attDate, setAttDate] = useState(todayISO);
  const [payMonth, setPayMonth] = useState(thisMonth);

  // Load classes + records from Supabase whenever the logged-in user changes
  useEffect(() => {
    if (!currentUser) return;
    setLoaded(false);
    (async () => {
      const { data: cls } = await supabase.from('classes').select('*').order('created_at');
      const loadedClasses = (cls || []).map(c => ({ ...c, students: c.students || [] }));
      setClasses(loadedClasses);

      const ids = loadedClasses.map(c => c.id);
      if (ids.length > 0) {
        const { data: recs } = await supabase.from('records').select('*').in('class_id', ids);
        if (recs) {
          const map = {};
          recs.forEach(r => { map[r.class_id] = r.data || {}; });
          setRecords(map);
        }
      }
      setLoaded(true);
    })();
  }, [currentUser?.id]);

  // Debounced Supabase sync for record mutations
  const syncTimers = useRef({});
  const ownerIdRef = useRef(null);
  useEffect(() => { ownerIdRef.current = currentUser?.id; }, [currentUser?.id]);

  const syncRecord = useCallback((classId, data) => {
    clearTimeout(syncTimers.current[classId]);
    syncTimers.current[classId] = setTimeout(async () => {
      if (!ownerIdRef.current) return;
      await supabase.from('records').upsert(
        { class_id: classId, owner_id: ownerIdRef.current, data, updated_at: new Date().toISOString() },
        { onConflict: 'class_id' }
      );
    }, 800);
  }, []);

  const toggleAttendance = (classId, date, student) => {
    setRecords(prev => {
      const cls = prev[classId] || { attendance: {}, payment: {}, grades: {} };
      const day = { ...(cls.attendance?.[date] || {}) };
      day[student] = !day[student];
      const newCls = { ...cls, attendance: { ...cls.attendance, [date]: day } };
      syncRecord(classId, newCls);
      return { ...prev, [classId]: newCls };
    });
  };

  const markAllPresent = (classId, date, students) => {
    setRecords(prev => {
      const cls = prev[classId] || { attendance: {}, payment: {}, grades: {} };
      const day = { ...(cls.attendance?.[date] || {}) };
      students.forEach(s => { day[s] = true; });
      const newCls = { ...cls, attendance: { ...cls.attendance, [date]: day } };
      syncRecord(classId, newCls);
      return { ...prev, [classId]: newCls };
    });
  };

  const togglePayment = (classId, month, student) => {
    setRecords(prev => {
      const cls = prev[classId] || { attendance: {}, payment: {}, grades: {} };
      const mon = { ...(cls.payment?.[month] || {}) };
      mon[student] = !mon[student];
      const newCls = { ...cls, payment: { ...cls.payment, [month]: mon } };
      syncRecord(classId, newCls);
      return { ...prev, [classId]: newCls };
    });
  };

  const setGradeScore = (classId, date, student, score) => {
    setRecords(prev => {
      const cls = prev[classId] || { attendance: {}, payment: {}, grades: {} };
      const day = { ...(cls.grades?.[date] || {}) };
      if (score) day[student] = score;
      else delete day[student];
      const newCls = { ...cls, grades: { ...(cls.grades || {}), [date]: day } };
      syncRecord(classId, newCls);
      return { ...prev, [classId]: newCls };
    });
  };

  const countAttendance = (classId, student) => {
    const cls = records[classId];
    if (!cls || !cls.attendance) return 0;
    return Object.values(cls.attendance).filter(day => day[student]).length;
  };

  const updateNote = (classId, student, text) => {
    setRecords(prev => {
      const cls = prev[classId] || { attendance: {}, payment: {}, notes: {} };
      const newCls = { ...cls, notes: { ...(cls.notes || {}), [student]: text } };
      syncRecord(classId, newCls);
      return { ...prev, [classId]: newCls };
    });
  };

  const [profile, setProfile] = useState(null);
  const [openTrimesters, setOpenTrimesters] = useState({ t1: true, t2: false, t3: false, t4: false });

  const getStudentHistory = (classId, student) => {
    const cls = records[classId] || { attendance: {}, payment: {}, notes: {}, grades: {}, trimesterGrades: {} };
    const attendance = Object.entries(cls.attendance || {})
      .map(([date, day]) => ({ date, present: !!day[student] }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const payments = Object.entries(cls.payment || {})
      .filter(([, mon]) => mon[student])
      .map(([month]) => month)
      .sort((a, b) => b.localeCompare(a));
    const scores = Object.entries(cls.grades || {})
      .filter(([, day]) => day[student])
      .map(([date, day]) => ({ date, score: day[student] }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const note = (cls.notes || {})[student] || "";
    const presentCount = attendance.filter(a => a.present).length;
    const absentCount = attendance.filter(a => !a.present).length;
    const trimesterGrades = ((cls.trimesterGrades || {})[student]) || {};
    return { attendance, payments, scores, note, presentCount, absentCount, trimesterGrades };
  };

  const setTrimesterFinalGrade = (classId, student, trimester, gradeVal) => {
    setRecords(prev => {
      const cls = prev[classId] || { attendance: {}, payment: {}, grades: {}, trimesterGrades: {} };
      const tg = { ...(cls.trimesterGrades || {}) };
      const st = { ...(tg[student] || {}) };
      if (gradeVal) st[trimester] = gradeVal; else delete st[trimester];
      tg[student] = st;
      const newCls = { ...cls, trimesterGrades: tg };
      syncRecord(classId, newCls);
      return { ...prev, [classId]: newCls };
    });
  };

  const addClass = async () => {
    const name = newClassName.trim();
    if (!name) return;
    const id = "c_" + Date.now();
    const newClass = { id, name, owner_id: currentUser.id, students: [] };
    const { error } = await supabase.from('classes').insert(newClass);
    if (!error) setClasses(prev => [...prev, newClass]);
    setNewClassName("");
  };

  const deleteClass = async (id) => {
    await supabase.from('classes').delete().eq('id', id);
    setClasses(prev => prev.filter(c => c.id !== id));
    if (selectedClassId === id) { setSelectedClassId(""); setSelectedStudent(""); }
  };

  const addStudent = async (classId) => {
    const name = (newStudentInputs[classId] || "").trim();
    if (!name) return;
    const cls = classes.find(c => c.id === classId);
    if (!cls || cls.students.includes(name)) return;
    const newStudents = [...cls.students, name];
    await supabase.from('classes').update({ students: newStudents }).eq('id', classId);
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, students: newStudents } : c));
    setNewStudentInputs(prev => ({ ...prev, [classId]: "" }));
  };

  const removeStudent = async (classId, name) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    const newStudents = cls.students.filter(s => s !== name);
    await supabase.from('classes').update({ students: newStudents }).eq('id', classId);
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, students: newStudents } : c));
  };

  const filteredTopics = grade === "all"
    ? TOPICS
    : TOPICS.filter(t => t.grade === grade);

  const currentTopicData = selectedTopic ? TOPIC_DATA[selectedTopic] : null;
  const supportedTypes = currentTopicData?.supportedTypes;

  const selectTopic = (id) => {
    setSelectedTopic(id);
    const td = TOPIC_DATA[id];
    setTaskType(td?.supportedTypes?.[0] || "match");
  };

  const generate = () => {
    if (!selectedTopic) return;
    const effectiveType = supportedTypes?.includes(taskType) ? taskType : undefined;
    const result = generateTasks(selectedTopic, count, effectiveType);
    setTasks(result);
    setShowAnswers(false);
    setPdfModal(true);
    setGenerateKey(k => k + 1);
  };

  const topic = TOPICS.find(t => t.id === selectedTopic);
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const studentName = selectedStudent;

  if (!authLoaded) return null;

  if (passwordReset) {
    return (
      <>
        <style>{styles}</style>
        <div className="auth-overlay">
          <div className="auth-card">
            <Logo variant="icon" size={62} className="auth-logo" />
            <div className="auth-title">ESLtopia</div>
            <div className="auth-subtitle">Set a new password</div>
            <ResetPasswordForm onDone={async () => {
              await supabase.auth.signOut();
              setPasswordReset(false);
              setCurrentUser(null);
              // Drop the ?setup=1 marker so a refresh returns to normal login.
              window.history.replaceState({}, '', window.location.pathname);
            }} />
          </div>
        </div>
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <style>{styles}</style>
        <AuthScreen onLogin={handleLogin} />
      </>
    );
  }

  if (showLanding) {
    return (
      <>
        <style>{styles}</style>
        <LandingPage onStart={() => setShowLanding(false)} />
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="header">
          <div className="logo-mark">
            <Logo size={52} />
          </div>
          <div className="header-text">
            <h1>ESLtopia</h1>
            <p>Worksheet Generator · <strong style={{color:"#f76707"}}>Grades 1–3: Disney Stars &amp; Heroes</strong> · Grades 4–6</p>
          </div>
          <div className="user-badge">
            <div className="user-avatar">
              {(currentUser.firstName?.[0] || "") + (currentUser.lastName?.[0] || "")}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser.firstName} {currentUser.lastName}</span>
              <span className="user-role-label">{ROLE_META[currentUser.role]?.label || currentUser.role}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Sign out">Sign out</button>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${view === "generator" ? "active" : ""}`} onClick={() => setView("generator")}>
            📝 Generator
          </button>
          <button className={`tab ${view === "classes" ? "active" : ""}`} onClick={() => setView("classes")}>
            👥 Classes {classes.length > 0 && `(${classes.length})`}
          </button>
          <button className={`tab ${view === "records" ? "active" : ""}`} onClick={() => setView("records")}>
            📋 Records
          </button>
          {currentUser.role === "superadmin" && (
            <button className={`tab ${view === "admin" ? "active" : ""}`} onClick={() => setView("admin")}>
              🔑 Admin
            </button>
          )}
          {currentUser.role === "school" && (
            <button className={`tab ${view === "employees" ? "active" : ""}`} onClick={() => setView("employees")}>
              🧑‍🏫 Employees
            </button>
          )}
        </div>

        {view === "classes" && (
          <div className="classes-panel">
            <div className="config-title">My Classes</div>
            <div className="add-class-row">
              <input
                className="text-input"
                type="text"
                placeholder="Class name, e.g. 1-A or Grade 5"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addClass(); }}
              />
              <button className="mini-btn" onClick={addClass} disabled={!newClassName.trim()}>
                + Add class
              </button>
            </div>

            {classes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-emoji">📚</div>
                <div className="empty-state-text">
                  You don't have any classes yet.<br />
                  Add your first class above, then add students.
                </div>
              </div>
            ) : (
              classes.map(c => (
                <div className="class-card" key={c.id}>
                  <div className="class-card-head">
                    <div>
                      <div className="class-name">{c.name}</div>
                      <div className="class-count">{c.students.length} {c.students.length === 1 ? "student" : "students"}</div>
                    </div>
                    <button className="delete-class-btn" onClick={() => deleteClass(c.id)}>Delete class</button>
                  </div>

                  {c.students.length === 0 ? (
                    <div className="empty-students">No students in this class yet.</div>
                  ) : (
                    <div className="student-tags">
                      {c.students.map(s => (
                        <span className="student-tag" key={s}>
                          <button
                            onClick={() => setProfile({ classId: c.id, name: s })}
                            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", font: "inherit", padding: 0 }}
                            title="Open profile"
                          >{s}</button>
                          <button onClick={() => removeStudent(c.id, s)} title="Remove">×</button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="add-student-row">
                    <input
                      className="text-input"
                      type="text"
                      placeholder="Student name"
                      value={newStudentInputs[c.id] || ""}
                      onChange={e => setNewStudentInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") addStudent(c.id); }}
                    />
                    <button
                      className="mini-btn ghost"
                      onClick={() => addStudent(c.id)}
                      disabled={!(newStudentInputs[c.id] || "").trim()}
                    >+ Add</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === "records" && (
          <div className="classes-panel">
            <div className="config-title">Records — attendance, grades &amp; payment</div>

            {classes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-emoji">📋</div>
                <div className="empty-state-text">
                  You have no classes for records.<br />
                  First create a class and add students in the "Classes" tab.
                </div>
              </div>
            ) : (
              <>
                <div className="records-controls">
                  <div className="field">
                    <label>Class</label>
                    <select value={recordsClassId} onChange={e => setRecordsClassId(e.target.value)}>
                      <option value="">— Select class —</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Class date (attendance / grade)</label>
                    <input className="text-input" type="date" value={attDate} onChange={e => setAttDate(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Month (payment)</label>
                    <input className="text-input" type="month" value={payMonth} onChange={e => setPayMonth(e.target.value)} />
                  </div>
                </div>

                {(() => {
                  const cls = classes.find(c => c.id === recordsClassId);
                  if (!cls) return (
                    <div className="empty-students" style={{ textAlign: "center", padding: "20px 0" }}>
                      Select a class to see the student list.
                    </div>
                  );
                  if (cls.students.length === 0) return (
                    <div className="empty-students" style={{ textAlign: "center", padding: "20px 0" }}>
                      This class has no students yet.
                    </div>
                  );

                  const rec = records[cls.id] || { attendance: {}, payment: {}, grades: {} };
                  const dayAtt = rec.attendance?.[attDate] || {};
                  const monPay = rec.payment?.[payMonth] || {};
                  const dayGrades = rec.grades?.[attDate] || {};
                  const presentCount = cls.students.filter(s => dayAtt[s]).length;
                  const paidCount = cls.students.filter(s => monPay[s]).length;

                  return (
                    <>
                      <div className="quick-fill-row">
                        <span className="quick-fill-label">Quick:</span>
                        <button
                          className="quick-fill-btn"
                          onClick={() => markAllPresent(cls.id, attDate, cls.students)}
                        >
                          ✓ All present ({attDate.split("-").reverse().join(".")})
                        </button>
                      </div>
                      <table className="records-table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th className="center">Present<br />({attDate.split("-").reverse().join(".")})</th>
                            <th className="center">Total<br />attendance</th>
                            <th className="center">Grade<br />({attDate.split("-").reverse().join(".")})</th>
                            <th className="center">Paid<br />({payMonth})</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cls.students.map(s => {
                            const present = !!dayAtt[s];
                            const paid = !!monPay[s];
                            const score = dayGrades[s] || "";
                            return (
                              <tr key={s}>
                                <td className="student-cell">
                                  <button className="student-link" onClick={() => setProfile({ classId: cls.id, name: s })}>
                                    {s}
                                  </button>
                                </td>
                                <td className="center">
                                  <button
                                    className={`check ${present ? "checked" : ""}`}
                                    onClick={() => toggleAttendance(cls.id, attDate, s)}
                                    title={present ? "Present" : "Absent"}
                                  >
                                    {present && (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </button>
                                </td>
                                <td className="center">
                                  <span className="att-count">{countAttendance(cls.id, s)}</span>
                                </td>
                                <td className="center">
                                  <select
                                    className="grade-select"
                                    value={score}
                                    onChange={e => setGradeScore(cls.id, attDate, s, e.target.value)}
                                  >
                                    <option value="">—</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                  </select>
                                </td>
                                <td className="center">
                                  <button
                                    className={`check pay ${paid ? "checked pay" : ""}`}
                                    onClick={() => togglePayment(cls.id, payMonth, s)}
                                    title={paid ? "Paid" : "Not paid"}
                                  >
                                    {paid && (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <div className="pay-summary">
                        <div className="pay-summary-item">
                          <span className="pay-summary-label">Present today</span>
                          <span className="pay-summary-value">{presentCount} / {cls.students.length}</span>
                        </div>
                        <div className="pay-summary-item">
                          <span className="pay-summary-label">Paid ({payMonth})</span>
                          <span className="pay-summary-value">{paidCount} / {cls.students.length}</span>
                        </div>
                        <div className="pay-summary-item">
                          <span className="pay-summary-label">Not paid</span>
                          <span className="pay-summary-value" style={{ color: paidCount < cls.students.length ? "#ff6b6b" : "#51cf66" }}>
                            {cls.students.length - paidCount}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {view === "admin" && currentUser.role === "superadmin" && (
          <AdminPanel currentUser={currentUser} />
        )}

        {view === "employees" && currentUser.role === "school" && (
          <EmployeesPanel currentUser={currentUser} />
        )}

        {view === "generator" && (
          <>
            <div className="configurator">
              <div className="config-title">Settings</div>

              <div className="config-row">
                <div className="field">
                  <label>Grade</label>
                  <select value={grade} onChange={e => { setGrade(e.target.value); setSelectedTopic(null); }}>
                    <option value="all">All grades</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                    <option value="6">Grade 6</option>
                  </select>
                </div>
                <div className="field">
                  <label>Number of exercises</label>
                  <input
                    type="number"
                    className="text-input"
                    min={5}
                    max={20}
                    value={count}
                    onChange={e => setCount(Math.max(5, Math.min(20, parseInt(e.target.value) || 10)))}
                  />
                </div>
              </div>

              <div className="field full" style={{ marginBottom: 16 }}>
                <label>Topic</label>
                <div className="topic-grid">
                  {filteredTopics.map(t => (
                    <div
                      key={t.id}
                      className={`topic-card ${selectedTopic === t.id ? "active" : ""}`}
                      onClick={() => selectTopic(t.id)}
                    >
                      <div className="topic-emoji">{t.emoji}</div>
                      <div className="topic-name">{t.name}</div>
                      <div className="topic-desc">{t.desc} · Grade {t.grade}</div>
                    </div>
                  ))}
                </div>
              </div>

              {supportedTypes && supportedTypes.length > 1 && (
                <div className="field full" style={{ marginBottom: 16 }}>
                  <label>Exercise type</label>
                  <div className="type-pills">
                    <button
                      className={`type-pill ${taskType === "match" ? "active" : ""}`}
                      onClick={() => setTaskType("match")}
                    >
                      🔗 Match
                    </button>
                    <button
                      className={`type-pill ${taskType === "tf" ? "active" : ""}`}
                      onClick={() => setTaskType("tf")}
                    >
                      ✓✗ True / False
                    </button>
                  </div>
                </div>
              )}

              <div className="config-row" style={{ marginBottom: 0 }}>
                <div className="field">
                  <label>Class</label>
                  <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSelectedStudent(""); }}>
                    <option value="">— No class —</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Student (optional)</label>
                  <select
                    value={selectedStudent}
                    onChange={e => setSelectedStudent(e.target.value)}
                    disabled={!selectedClass || selectedClass.students.length === 0}
                  >
                    <option value="">
                      {!selectedClass
                        ? "Select a class first"
                        : selectedClass.students.length === 0
                          ? "No students in class"
                          : "— Select student —"}
                    </option>
                    {selectedClass && selectedClass.students.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {classes.length === 0 && (
                <p style={{ fontSize: 12, color: "#c4a498", marginTop: 10 }}>
                  💡 Create classes in the "Classes" tab to select students from the list.
                </p>
              )}

              <button
                className="gen-btn"
                onClick={generate}
                disabled={!selectedTopic}
                style={{ marginTop: 20 }}
              >
                ✏️ Generate worksheet
              </button>
            </div>

            {tasks && topic && (
              <div className="worksheet-wrap">
                <div className="worksheet-toolbar">
                  <div className="worksheet-meta">
                    <strong>{topic.emoji} {topic.name}</strong> · Grade {topic.grade} · {tasks.items?.length || tasks.pairs?.length} exercises
                  </div>
                  <div className="toolbar-actions">
                    <button className="action-btn" onClick={() => setShowAnswers(!showAnswers)}>
                      {showAnswers ? "Hide answers" : "Show answers"}
                    </button>
                    <button className="action-btn" onClick={generate}>New set</button>
                    <button className="action-btn primary" onClick={() => setPdfModal(true)}>🖨 Preview PDF</button>
                  </div>
                </div>

                <div className="worksheet">
                  <div className="ws-header">
                    <div>
                      <div className="ws-badge">Grade {topic.grade} · English</div>
                      <div className="ws-title">{topic.emoji} {topic.name}</div>
                      <div className="ws-subtitle">{topic.desc}</div>
                    </div>
                    <div className="ws-fields">
                      <div className="ws-field-line">Name: <span>{studentName}</span></div>
                      {selectedClass && <div className="ws-field-line">Class: <span>{selectedClass.name}</span></div>}
                      <div className="ws-field-line">Date: <span /></div>
                      <div className="ws-field-line">Grade: <span /></div>
                    </div>
                  </div>

                  {tasks.type === "listen-circle" && <ListenCircleTask data={tasks} />}
                  {tasks.type === "color-boxes" && <ColorBoxTask data={tasks} />}
                  {tasks.type === "match" && <MatchTask data={tasks} showAnswers={showAnswers} />}
                  {tasks.type === "fillin" && <FillInTask data={tasks} showAnswers={showAnswers} />}
                  {tasks.type === "tf" && <TrueFalseTask data={tasks} showAnswers={showAnswers} />}
                </div>
              </div>
            )}
          </>
        )}

        {profile && (() => {
          const cls = classes.find(c => c.id === profile.classId);
          const hist = getStudentHistory(profile.classId, profile.name);
          const initials = profile.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
          return (
            <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setProfile(null); }}>
              <div className="modal">
                <div className="modal-head">
                  <button className="modal-close" onClick={() => setProfile(null)}>×</button>
                  <div className="modal-avatar">{initials}</div>
                  <div className="modal-name">{profile.name}</div>
                  <div className="modal-class">{cls ? cls.name : ""}</div>
                </div>

                <div className="modal-body">
                  <div className="profile-stats">
                    <div className="profile-stat stat-present">
                      <div className="profile-stat-value green">{hist.presentCount}</div>
                      <div className="profile-stat-label">Attendances</div>
                    </div>
                    <div className="profile-stat stat-absent">
                      <div className="profile-stat-value red">{hist.absentCount}</div>
                      <div className="profile-stat-label">Absences</div>
                    </div>
                    {TRIMESTERS.map(tr => (
                      <div className="profile-stat stat-grade" key={tr.key}>
                        <div className="profile-stat-value blue">{hist.trimesterGrades[tr.key] || "—"}</div>
                        <div className="profile-stat-label">{tr.short}</div>
                      </div>
                    ))}
                  </div>

                  <div className="profile-block">
                    <div className="profile-section-title">Terms</div>
                    {TRIMESTERS.map(tr => {
                      const trAtt = hist.attendance.filter(a => tr.months.includes(dateMonth(a.date)));
                      const trScores = hist.scores.filter(s => tr.months.includes(dateMonth(s.date)));
                      const finalGrade = hist.trimesterGrades[tr.key] || "";
                      const pres = trAtt.filter(a => a.present).length;
                      const abs = trAtt.filter(a => !a.present).length;
                      const isOpen = openTrimesters[tr.key];
                      return (
                        <div className="trimester-block" key={tr.key}>
                          <div
                            className={`trimester-header ${tr.key}`}
                            onClick={() => setOpenTrimesters(prev => ({ ...prev, [tr.key]: !prev[tr.key] }))}
                          >
                            <div className="trimester-header-left">
                              <div className="trimester-name">{tr.name}</div>
                              <div className="trimester-period">{tr.period}</div>
                            </div>
                            <div className="trimester-chips">
                              {pres > 0 && <span className="trimester-chip att">✓ {pres}</span>}
                              {abs > 0  && <span className="trimester-chip abs">✗ {abs}</span>}
                              {finalGrade && <span className="trimester-chip fin">{finalGrade}</span>}
                            </div>
                            <span className={`trimester-toggle ${isOpen ? "open" : ""}`}>▼</span>
                          </div>
                          {isOpen && (
                            <div className="trimester-content">
                              <div>
                                <div className="trimester-sub">Attendance</div>
                                {trAtt.length === 0 ? (
                                  <div className="trimester-empty">No classes recorded.</div>
                                ) : (
                                  <div className="att-log">
                                    {trAtt.map(a => (
                                      <div className={`att-log-row ${a.present ? "present" : "absent"}`} key={a.date}>
                                        <span>{a.date.split("-").reverse().join(".")}</span>
                                        <span className="att-log-status">{a.present ? "✓ Present" : "✗ Absent"}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="trimester-sub">Grades</div>
                                {trScores.length === 0 ? (
                                  <div className="trimester-empty">No grades recorded.</div>
                                ) : (
                                  <div className="scores-log">
                                    {trScores.map(s => (
                                      <div className="score-log-row" key={s.date}>
                                        <span>{s.date.split("-").reverse().join(".")}</span>
                                        <span className="score-badge">{s.score}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="trimester-final-row">
                                <div className="trimester-final-label">Final grade</div>
                                <select
                                  className="trimester-final-select"
                                  value={finalGrade}
                                  onChange={e => setTrimesterFinalGrade(profile.classId, profile.name, tr.key, e.target.value)}
                                >
                                  <option value="">—</option>
                                  <option value="1">1</option>
                                  <option value="2">2</option>
                                  <option value="3">3</option>
                                  <option value="4">4</option>
                                  <option value="5">5</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="profile-block">
                    <div className="profile-section-title">Paid months</div>
                    {hist.payments.length === 0 ? (
                      <div className="profile-empty">No payments recorded yet.</div>
                    ) : (
                      <div className="pay-months">
                        {hist.payments.map(m => (
                          <span className="pay-month-chip" key={m}>{m}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="profile-block" style={{ marginBottom: 0 }}>
                    <div className="profile-section-title">Notes</div>
                    <textarea
                      className="notes-area"
                      placeholder="Notes on student — progress, behaviour, special needs..."
                      value={hist.note}
                      onChange={e => updateNote(profile.classId, profile.name, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <PdfPreviewModal
        open={pdfModal}
        topic={topic}
        tasks={tasks}
        studentName={studentName}
        selectedClass={selectedClass}
        showAnswers={showAnswers}
        sheetKey={generateKey}
        styles={styles}
        onClose={() => setPdfModal(false)}
        onNewSet={generate}
        onToggleAnswers={() => setShowAnswers(v => !v)}
      />
    </>
  );
}
