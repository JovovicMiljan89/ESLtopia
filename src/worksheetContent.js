import { shuffle } from './WorksheetTasks.jsx';

// ─── DATA ────────────────────────────────────────────────────────────────────

export const TOPICS = [
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

export function generateTasks(topicId, count, taskType) {
  const data = TOPIC_DATA[topicId];
  if (!data) return null;
  return data.generate(count, taskType);
}

export const TOPIC_DATA = {
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
