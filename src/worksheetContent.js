import { shuffle } from './WorksheetTasks.jsx';
import emojiIconManifest from './emojiIconManifest.json';

// ─── DATA ────────────────────────────────────────────────────────────────────

export const TOPICS = [
  { id: "alphabet", emoji: "🔤", name: "Alphabet", desc: "Slova — Stars & Heroes", grade: "1" },
  { id: "colors", emoji: "🎨", name: "Colors", desc: "Boje — Mickey, Minnie, Donald…", grade: "1" },
  { id: "numbers", emoji: "🔢", name: "Numbers 1–20", desc: "Brojevi — Stars & Heroes", grade: "1" },
  { id: "animals", emoji: "🐾", name: "Animals", desc: "Pluto, Simba, Nemo i drugi", grade: "1" },
  { id: "family", emoji: "👨‍👩‍👧", name: "Family", desc: "Porodica — Stars & Heroes", grade: "1" },
  { id: "body", emoji: "🧍", name: "Body parts", desc: "Delovi tela — Mickey & friends", grade: "2" },
  { id: "food", emoji: "🍎", name: "Food", desc: "Hrana — Stars & Heroes", grade: "2" },
  { id: "animal_babies", emoji: "🐣", name: "Animal Babies", desc: "Povezi životinju sa mladunčetom", grade: "2" },
  { id: "am_is_are", emoji: "✏️", name: "am / is / are", desc: "Mickey is happy — glagol to be", grade: "2" },
  { id: "a_an", emoji: "📝", name: "a / an", desc: "Neodređeni član — Stars & Heroes", grade: "2" },
  { id: "classroom", emoji: "🏫", name: "Classroom", desc: "Učionica — Stars & Heroes", grade: "2" },
  { id: "toys", emoji: "🧸", name: "Toys", desc: "Igračke — Mickey & friends", grade: "2" },
  { id: "my_home", emoji: "🏠", name: "My home", desc: "Moj dom — sobe i nameštaj", grade: "2" },
  { id: "seasons_weather", emoji: "☀️", name: "Seasons and weather", desc: "Godišnja doba i vreme", grade: "2" },
  // Grade 3
  { id: "sports", emoji: "⚽", name: "Sports", desc: "Sportovi — Mickey & Heroes", grade: "3" },
  { id: "clothes", emoji: "👕", name: "Clothes", desc: "Minnie's dress, Donald's hat…", grade: "3" },
  { id: "adjectives", emoji: "📏", name: "Adjectives", desc: "Pridevi — Stars & Heroes", grade: "3" },
  { id: "prepositions", emoji: "📦", name: "Prepositions", desc: "Gde je Mickey? in/on/under…", grade: "3" },
  { id: "present_simple_3rd", emoji: "🔄", name: "Present Simple", desc: "Mickey plays, Minnie reads…", grade: "3" },
  { id: "places_in_town", emoji: "🏙️", name: "Places in town", desc: "Mesta u gradu — Stars & Heroes", grade: "3" },
  { id: "sea_world", emoji: "🌊", name: "Sea world", desc: "Podvodni svet — Nemo i prijatelji", grade: "3" },
  { id: "at_school", emoji: "🎒", name: "At school", desc: "U školi — ljudi, mesta i predmeti", grade: "3" },
  // Grade 4
  { id: "comparatives", emoji: "📊", name: "Comparatives", desc: "Poređenje prideva", grade: "4" },
  { id: "have_has", emoji: "🤲", name: "have / has", desc: "Glagol have i has", grade: "4" },
  { id: "plurals", emoji: "📚", name: "Plurals", desc: "Množina imenica", grade: "4" },
  { id: "do_does", emoji: "❓", name: "Do / Does?", desc: "Pitanja u sadašnjem vremenu", grade: "4" },
  { id: "present_simple_negative", emoji: "🚫", name: "Present Simple — Negative", desc: "Negacija — don't / doesn't", grade: "4" },
  { id: "present_simple_questions", emoji: "❔", name: "Present Simple — Questions", desc: "Napiši pitanje u sadašnjem vremenu", grade: "4" },
  { id: "present_simple_short_answers", emoji: "💬", name: "Present Simple — Short Answers", desc: "Yes, he does. / No, she doesn't.", grade: "4" },
  { id: "present_continuous", emoji: "🏃", name: "Present Continuous", desc: "Mickey is running — is/am/are + -ing", grade: "4" },
  // Grade 5
  { id: "past_simple_regular", emoji: "⏮️", name: "Past Simple", desc: "Pravilni glagoli (-ed)", grade: "5" },
  { id: "past_simple_irregular", emoji: "⚡", name: "Irregular Verbs", desc: "Nepravilni glagoli", grade: "5" },
  { id: "past_simple_negative", emoji: "❌", name: "Past Simple — didn't", desc: "Negacija u prošlom vremenu", grade: "5" },
  { id: "will_going_to", emoji: "🔮", name: "Will and Be going to", desc: "Buduće vreme — will / be going to", grade: "5" },
  // Grade 6
  { id: "past_simple_questions", emoji: "🔍", name: "Past Simple — Did?", desc: "Pitanja u prošlom vremenu", grade: "6" },
  { id: "past_simple_mixed", emoji: "🔀", name: "Past Simple — Mix", desc: "Mešoviti zadaci", grade: "6" },
  { id: "past_continuous", emoji: "⏳", name: "Past Continuous", desc: "She was reading — was/were + -ing", grade: "6" },
  { id: "present_perfect", emoji: "✅", name: "Present Perfect", desc: "I have seen — have/has + particip", grade: "6" },
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

// Grades 1–2 are pre/early-reading — worksheets and flashcards for those
// topics must not rely on a printed Serbian translation, since the whole
// point (listening + picture recognition) breaks down if a child has to
// read the answer instead.
function isYoungGrade(topicId) {
  const meta = TOPICS.find(t => t.id === topicId);
  return meta ? (meta.grade === "1" || meta.grade === "2") : false;
}

// Builds a true/false round out of fillin sentences (am_is_are, prepositions,
// do_does, present/past continuous, present perfect, will/going to, ...) —
// half get their real answer proposed (TRUE), the rest get a wrong answer
// swapped in from elsewhere in the same pool (FALSE). Many of these sentences
// embed a "(verb)" hint right after the blank (e.g. "Mickey ___ (run) in the
// park now."), so splicing a swapped-in answer directly into the sentence
// text can read as nonsense next to that hint ("Mickey is eating (run)...").
// Showing sentence → "candidate answer" as a template, instead of rewriting
// the sentence, sidesteps that entirely.
function toSentenceTF(items) {
  const targetCorrect = Math.round(items.length / 2);
  const correctIdx = new Set(shuffle([...Array(items.length).keys()]).slice(0, targetCorrect));
  // Some source sentences (present_simple_questions, present_simple_short_answers)
  // already end in "→ ___" as their own fill-in blank marker — strip that
  // before appending "→ candidate", so it doesn't end up with a double arrow.
  const base = (s) => s.replace(/\s*→\s*_{2,}\s*$/, "");
  return {
    type: "tf",
    instruction: 'Zaokruži TRUE ako je ponuđeni odgovor tačan za datu rečenicu, FALSE ako nije.',
    items: items.map((item, i) => {
      const stem = base(item.sentence);
      if (correctIdx.has(i)) {
        return { sentence: `${stem} → "${item.answer}"`, answer: true };
      }
      const others = items.filter((_, j) => j !== i).map(o => o.answer);
      const wrong = others.length > 0 ? shuffle(others)[0] : item.answer;
      return { sentence: `${stem} → "${wrong}"`, answer: wrong === item.answer };
    }),
  };
}

// Negative form / questions / short answers all depend on the subject's
// person and number (he/she/it → does/doesn't, I/we/you/they → do/don't),
// which the app's other Present Simple content doesn't track as data — it's
// baked into hand-written sentences. Deriving these three exercise types
// from that loose text was the actual risk flagged before building this (a
// swapped-in wrong answer next to an unrelated "(verb)" hint reads as
// nonsense — see toSentenceTF above for where that already bit once).
// Rather than parse existing sentences, this is a small dedicated dataset
// with every field the grammar rules need spelled out explicitly, so
// nothing has to be inferred at generation time. "I" and "You" are left out
// on purpose: short answers to a question about "you" naturally flip to
// "I" ("Do you like pizza?" → "Yes, I do."), which is a real perspective
// shift these worksheets — non-interactive, no back-and-forth — have no
// clean way to model, so subjects are limited to ones where the answer's
// pronoun matches the question's subject with no flip needed.
const PRESENT_SIMPLE_SUBJECTS = [
  { subject: "Mickey", subjectInQuestion: "Mickey", pronoun: "he", thirdSg: true, base: "play", rest: "football on Sundays" },
  { subject: "Minnie", subjectInQuestion: "Minnie", pronoun: "she", thirdSg: true, base: "read", rest: "books every evening" },
  { subject: "Donald", subjectInQuestion: "Donald", pronoun: "he", thirdSg: true, base: "swim", rest: "in the lake" },
  { subject: "Daisy", subjectInQuestion: "Daisy", pronoun: "she", thirdSg: true, base: "cook", rest: "dinner for her family" },
  { subject: "Goofy", subjectInQuestion: "Goofy", pronoun: "he", thirdSg: true, base: "watch", rest: "cartoons after school" },
  { subject: "Pluto", subjectInQuestion: "Pluto", pronoun: "he", thirdSg: true, base: "run", rest: "in the park" },
  { subject: "My sister", subjectInQuestion: "my sister", pronoun: "she", thirdSg: true, base: "have", rest: "a big cat" },
  { subject: "We", subjectInQuestion: "we", pronoun: "we", thirdSg: false, base: "live", rest: "near the park" },
  { subject: "They", subjectInQuestion: "they", pronoun: "they", thirdSg: false, base: "study", rest: "English on Mondays" },
  { subject: "Mickey and Minnie", subjectInQuestion: "Mickey and Minnie", pronoun: "they", thirdSg: false, base: "clean", rest: "the clubhouse together" },
  { subject: "The children", subjectInQuestion: "the children", pronoun: "they", thirdSg: false, base: "play", rest: "in the garden" },
  { subject: "My parents", subjectInQuestion: "my parents", pronoun: "they", thirdSg: false, base: "work", rest: "in the city" },
];

function conjugate3rdPerson(base) {
  if (base === "have") return "has";
  if (base === "go") return "goes";
  if (base === "do") return "does";
  if (/[sxz]$|[cs]h$/.test(base)) return base + "es";
  if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + "ies";
  return base + "s";
}

// Topics with a plain word/emoji/sr picture pool that's meaningfully
// "categorizable" — excludes alphabet (letters) and numbers, since a letter
// or digit dropped into a word list isn't an odd-one-out in the same sense,
// and excludes colors, whose items have no emoji (they're colored in blank,
// not pictured) so it'd show as an empty box wherever it's used.
const ODD_ONE_OUT_TOPIC_IDS = [
  "animals", "family", "body", "food", "classroom",
  "toys", "my_home", "seasons_weather", "places_in_town", "sea_world", "at_school",
];

// count=50 is comfortably above every real vocab pool's size (all are ≤16),
// so this just returns the topic's full word list rather than a sample.
function getFullWordPool(topicId) {
  const data = TOPIC_DATA[topicId];
  if (!data) return [];
  const result = data.generate(50);
  return result.items || [];
}

// Groups of 4 pictures where 3 belong to the topic and 1 is "borrowed" from
// a different topic's pool — picture-only (no sr) since recognizing the
// mismatched category doesn't need reading, and works the same for every
// grade. Skipped for topics with too small a pool or no other topic to
// borrow from.
function buildOddOneOut(topicId, groupCount) {
  if (!ODD_ONE_OUT_TOPIC_IDS.includes(topicId)) return null;
  const ownPool = shuffle(getFullWordPool(topicId));
  const otherIds = ODD_ONE_OUT_TOPIC_IDS.filter(id => id !== topicId);
  if (ownPool.length < 3 || otherIds.length === 0) return null;

  const groups = [];
  const numGroups = Math.min(groupCount, Math.floor(ownPool.length / 3));
  for (let i = 0; i < numGroups; i++) {
    const belongs = ownPool.slice(i * 3, i * 3 + 3);
    if (belongs.length < 3) break;
    const intruderPool = getFullWordPool(shuffle(otherIds)[0]);
    if (intruderPool.length === 0) continue;
    const intruder = shuffle(intruderPool)[0];
    const words = shuffle([
      ...belongs.map(w => ({ word: w.word, emoji: w.emoji, isIntruder: false })),
      { word: intruder.word, emoji: intruder.emoji, isIntruder: true },
    ]);
    groups.push({ words, oddIndex: words.findIndex(w => w.isIntruder) });
  }

  return groups.length > 0 ? {
    type: "odd-one-out",
    instruction: "Zaokruži reč koja ne pripada grupi.",
    groups,
  } : null;
}

// "Circle the correct word" (picture + 3 word choices, one right) needs
// reading, unlike odd-one-out which is picture-only — so unlike that one,
// this is gated to grade 3+ topics only (isYoungGrade topics stay
// listening/picture-based, no exception). Distractors come from the same
// topic's own pool rather than a different topic's, since the point here is
// testing precise word recognition within a category, not category sense.
function buildCircleWord(topicId, count) {
  if (isYoungGrade(topicId) || !ODD_ONE_OUT_TOPIC_IDS.includes(topicId)) return null;
  const pool = getFullWordPool(topicId);
  if (pool.length < 3) return null;

  const chosen = shuffle(pool).slice(0, Math.min(count, pool.length));
  const items = chosen.map(w => {
    const distractors = shuffle(pool.filter(p => p.word !== w.word)).slice(0, 2);
    const options = shuffle([w.word, ...distractors.map(d => d.word)]);
    return { emoji: w.emoji, options, correctIndex: options.indexOf(w.word) };
  });

  return {
    type: "circle-word",
    instruction: "Zaokruži tačnu reč za svaku sličicu.",
    items,
  };
}

// Resolves an emoji to its OpenMoji color/outline SVG pair (see
// public/icons/ATTRIBUTION.md) via the Unicode-codepoint manifest built by
// scripts/build-icon-manifest.mjs. Not every emoji in the app has a match
// (166/168 do — the two misses are the concatenated multi-digit keycap
// strings for "eleven"/"twelve", which aren't real single emoji), so this
// returns null rather than a broken path when there's no entry.
function iconPaths(emoji) {
  const hex = emojiIconManifest[emoji];
  if (!hex) return null;
  return { color: `/icons/color/${hex}.svg`, outline: `/icons/outline/${hex}.svg` };
}

// Match the picture to its shadow — the color icon on one side, its own
// black-outline "shadow" (shuffled) on the other. Purely visual, no reading
// needed, so unlike circle-word this applies to every grade including 1-2.
function buildPictureShadow(topicId, count) {
  if (!ODD_ONE_OUT_TOPIC_IDS.includes(topicId)) return null;
  const pool = getFullWordPool(topicId);
  const withIcons = pool.map(w => ({ word: w.word, icons: iconPaths(w.emoji) })).filter(w => w.icons);
  if (withIcons.length < 4) return null;

  const chosen = shuffle(withIcons).slice(0, Math.min(count, withIcons.length));
  return {
    type: "picture-shadow",
    instruction: "Poveži svaku sliku sa njenom senkom.",
    pairs: chosen.map(w => ({ word: w.word, color: w.icons.color, outline: w.icons.outline })),
  };
}

// Trace the letters — Alphabet only. Dashed-stroke SVG text, not a font
// file: KG Primary Dots/National Primary Dotted (the fonts people usually
// reach for) are free for personal use only and would need a paid license
// for use in this app (see the earlier asset-sourcing pass). An SVG
// stroke-dasharray outline needs no font at all and has none of the
// rendering risk -webkit-text-stroke had (see the flashcard color-in fix —
// that was a genuine Chromium fringing bug with CSS text-stroke; SVG path
// stroking is a different, more predictable code path).
function buildTraceLetters(topicId, count) {
  if (topicId !== "alphabet") return null;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  return {
    type: "trace-letters",
    instruction: "Prevuci olovkom preko isprekidane linije da uvežbaš pisanje slova.",
    letters: shuffle(letters).slice(0, Math.min(count, letters.length)),
  };
}

// Fixed palette for "colour by numbers" — not tied to the colors topic's
// word data at all, since a legend of number → color WORD would require
// reading. A number next to an actual colored swatch is matched by sight,
// so this works for every grade including 1-2, same as picture-shadow.
const COLOR_BY_NUMBER_PALETTE = [
  { num: 1, hex: "#ffd43b" },
  { num: 2, hex: "#ff6b6b" },
  { num: 3, hex: "#4dabf7" },
  { num: 4, hex: "#69db7c" },
  { num: 5, hex: "#da77f2" },
  { num: 6, hex: "#ffa94d" },
];

function buildColorByNumbers(topicId, count) {
  if (!ODD_ONE_OUT_TOPIC_IDS.includes(topicId)) return null;
  const pool = getFullWordPool(topicId);
  const withIcons = pool.map(w => ({ word: w.word, icons: iconPaths(w.emoji) })).filter(w => w.icons);
  if (withIcons.length < 4) return null;

  const numColors = Math.min(6, Math.max(3, Math.ceil(withIcons.length / 3)));
  const legend = COLOR_BY_NUMBER_PALETTE.slice(0, numColors);
  const chosen = shuffle(withIcons).slice(0, Math.min(count, withIcons.length));
  // Cycling through the legend (rather than a random pick per item) spreads
  // every number across the picture grid instead of risking one number
  // dominating by chance — chosen is already shuffled, so which word lands
  // on which number still varies between generations.
  const items = chosen.map((w, i) => ({
    word: w.word,
    outline: w.icons.outline,
    number: legend[i % legend.length].num,
  }));

  return {
    type: "color-by-number",
    instruction: "Oboj svaku sličicu bojom koja odgovara njenom broju.",
    legend,
    items,
  };
}

// A worksheet is one topic's generate() output (the "primary" task) plus a
// second task built generically from the same word/sentence pool, so a
// worksheet is more than a single 10-item task without hand-authoring extra
// content per topic. Grades 1–2 stay reading-free (a second listen/color
// round with translations stripped); everything else gets a translation- or
// grammar-based second task appropriate to what the primary task produced.
export function generateWorksheet(topicId, count) {
  const data = TOPIC_DATA[topicId];
  if (!data) return null;
  const primary = data.generate(count);
  const sections = [primary];
  const young = isYoungGrade(topicId);

  if (primary.type === "listen-circle" || primary.type === "color-boxes") {
    if (young) {
      primary.items.forEach(it => { delete it.sr; });
      const second = data.generate(count);
      second.items.forEach(it => { delete it.sr; });
      sections.push(second);
    } else {
      const pairs = primary.items.map(it => ({ en: it.word, sr: it.sr })).filter(p => p.sr);
      if (pairs.length > 0) {
        sections.push({
          type: "match",
          instruction: "Povezi reč sa prevodom.",
          pairs,
          leftLabel: "English",
          rightLabel: "Srpski",
        });
      }
    }
    const oddOneOut = buildOddOneOut(topicId, Math.max(3, Math.min(6, Math.floor(count / 2))));
    if (oddOneOut) sections.push(oddOneOut);
    const circleWord = buildCircleWord(topicId, Math.max(4, Math.min(8, count)));
    if (circleWord) sections.push(circleWord);
    const pictureShadow = buildPictureShadow(topicId, Math.max(4, Math.min(8, count)));
    if (pictureShadow) sections.push(pictureShadow);
    const colorByNumbers = buildColorByNumbers(topicId, Math.max(4, Math.min(8, count)));
    if (colorByNumbers) sections.push(colorByNumbers);
    const traceLetters = buildTraceLetters(topicId, Math.min(count, 10));
    if (traceLetters) sections.push(traceLetters);
  } else if (primary.type === "match") {
    sections.push(makeTFFromPairs(primary.pairs, primary.pairs.length));
  } else if (primary.type === "fillin") {
    const hasBase = primary.items.every(it => typeof it.base === "string");
    if (hasBase) {
      sections.push({
        type: "match",
        instruction: "Povezi glagol sa odgovarajućim oblikom.",
        pairs: primary.items.map(it => ({ en: it.base, sr: it.answer })),
        leftLabel: "Infinitive",
        rightLabel: "Correct form",
      });
    } else {
      sections.push(toSentenceTF(primary.items));
    }
  }

  return sections;
}

// Every topic generator produces a different item shape (vocab word/emoji/sr,
// match en/sr pairs, fillin sentence/answer, tf sentence/boolean). Flashcards
// need one uniform {emoji, front, back} shape so the same modal can render
// cards for any topic, regardless of what kind of exercise it normally makes.
function toFlashcard(entry) {
  if (typeof entry.word === "string") {
    return { emoji: entry.emoji || "🔤", front: entry.word, back: entry.sr || "" };
  }
  if (typeof entry.en === "string") {
    return { emoji: "🔤", front: entry.en, back: entry.sr || "" };
  }
  if (typeof entry.answer === "boolean") {
    return { emoji: entry.answer ? "✅" : "❌", front: entry.sentence, back: entry.answer ? "TRUE" : "FALSE" };
  }
  if (typeof entry.sentence === "string" && typeof entry.answer === "string") {
    return { emoji: "✏️", front: entry.sentence, back: entry.answer };
  }
  return null;
}

export function generateFlashcards(topicId, count) {
  const data = TOPIC_DATA[topicId];
  if (!data) return null;
  const result = data.generate(count);
  const source = result.items || result.pairs || [];
  const cards = source.map(toFlashcard).filter(Boolean);
  // Only strip the back face for picture-vocab topics (word/emoji/sr), where
  // it really is a Serbian translation. Match-type topics carry a genuine
  // answer on the back regardless of grade (e.g. animal_babies' baby-animal
  // name, or past_simple_irregular's past-tense form) — stripping that would
  // silently break the exercise, not just hide a translation.
  const isTranslationBack = result.type === "listen-circle" || result.type === "color-boxes";
  return isYoungGrade(topicId) && isTranslationBack ? cards.map(c => ({ ...c, back: "" })) : cards;
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

  animal_babies: {
    generate(count) {
      // Distinct baby-animal names on purpose (not "calf" for both cow and
      // elephant, etc.) — a match exercise with two identical right-side
      // answers is genuinely ambiguous, not just a content nitpick.
      const pairs = shuffle([
        { en: "cat", sr: "kitten" },
        { en: "dog", sr: "puppy" },
        { en: "cow", sr: "calf" },
        { en: "horse", sr: "foal" },
        { en: "bird", sr: "chick" },
        { en: "rabbit", sr: "kit" },
        { en: "lion", sr: "cub" },
        { en: "monkey", sr: "infant" },
        { en: "snake", sr: "hatchling" },
        { en: "frog", sr: "tadpole" },
        { en: "fish", sr: "fry" },
      ]).slice(0, Math.min(count, 11));
      return {
        type: "match",
        instruction: "Povezi životinju sa njenim mladunčetom.",
        pairs,
        leftLabel: "Animal",
        rightLabel: "Baby",
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

  toys: {
    generate(count) {
      const all = [
        { word: "ball", emoji: "⚽", sr: "lopta" }, { word: "doll", emoji: "🪆", sr: "lutka" },
        { word: "teddy bear", emoji: "🧸", sr: "medvedić" }, { word: "car", emoji: "🚗", sr: "autić" },
        { word: "kite", emoji: "🪁", sr: "zmaj" }, { word: "robot", emoji: "🤖", sr: "robot" },
        { word: "puzzle", emoji: "🧩", sr: "slagalica" }, { word: "blocks", emoji: "🧱", sr: "kockice" },
        { word: "train", emoji: "🚂", sr: "voz" }, { word: "balloon", emoji: "🎈", sr: "balon" },
        { word: "drum", emoji: "🥁", sr: "bubanj" }, { word: "yo-yo", emoji: "🪀", sr: "jo-jo" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže igračku na engleskom. Zaokruži odgovarajuću sličicu! 🧸",
        teacherNote: "Izgovorite naziv igračke 2–3 puta. Deca zaokružuju sličicu.",
        items,
      };
    },
  },

  my_home: {
    generate(count) {
      const all = [
        { word: "kitchen", emoji: "🍳", sr: "kuhinja" }, { word: "bedroom", emoji: "🛏️", sr: "spavaća soba" },
        { word: "bathroom", emoji: "🛁", sr: "kupatilo" }, { word: "living room", emoji: "🛋️", sr: "dnevna soba" },
        { word: "garden", emoji: "🌳", sr: "bašta" }, { word: "table", emoji: "🪑", sr: "sto" },
        { word: "chair", emoji: "🪑", sr: "stolica" }, { word: "bed", emoji: "🛏️", sr: "krevet" },
        { word: "sofa", emoji: "🛋️", sr: "sofa" }, { word: "window", emoji: "🪟", sr: "prozor" },
        { word: "door", emoji: "🚪", sr: "vrata" }, { word: "lamp", emoji: "💡", sr: "lampa" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže deo kuće ili nameštaj na engleskom. Zaokruži odgovarajuću sličicu! 🏠",
        teacherNote: "Izgovorite reč 2–3 puta. Deca zaokružuju sličicu.",
        items,
      };
    },
  },

  seasons_weather: {
    generate(count) {
      const all = [
        { word: "spring", emoji: "🌸", sr: "proleće" }, { word: "summer", emoji: "☀️", sr: "leto" },
        { word: "autumn", emoji: "🍂", sr: "jesen" }, { word: "winter", emoji: "❄️", sr: "zima" },
        { word: "sunny", emoji: "🌞", sr: "sunčano" }, { word: "rainy", emoji: "🌧️", sr: "kišovito" },
        { word: "snowy", emoji: "🌨️", sr: "snežno" }, { word: "windy", emoji: "💨", sr: "vetrovito" },
        { word: "cloudy", emoji: "☁️", sr: "oblačno" }, { word: "hot", emoji: "🥵", sr: "vruće" },
        { word: "cold", emoji: "🥶", sr: "hladno" }, { word: "warm", emoji: "🌤️", sr: "toplo" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže godišnje doba ili vreme na engleskom. Zaokruži odgovarajuću sličicu! ☀️",
        teacherNote: "Izgovorite reč 2–3 puta. Deca zaokružuju sličicu.",
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

  places_in_town: {
    generate(count) {
      const all = [
        { word: "school", emoji: "🏫", sr: "škola" }, { word: "park", emoji: "🌳", sr: "park" },
        { word: "shop", emoji: "🏪", sr: "prodavnica" }, { word: "hospital", emoji: "🏥", sr: "bolnica" },
        { word: "bank", emoji: "🏦", sr: "banka" }, { word: "cinema", emoji: "🎬", sr: "bioskop" },
        { word: "restaurant", emoji: "🍽️", sr: "restoran" }, { word: "library", emoji: "📚", sr: "biblioteka" },
        { word: "station", emoji: "🚉", sr: "stanica" }, { word: "market", emoji: "🛒", sr: "pijaca" },
        { word: "zoo", emoji: "🦁", sr: "zoo vrt" }, { word: "museum", emoji: "🏛️", sr: "muzej" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže mesto u gradu na engleskom. Zaokruži odgovarajuću sličicu! 🏙️",
        teacherNote: "Izgovorite naziv mesta 2–3 puta. Deca zaokružuju sličicu.",
        items,
      };
    },
  },

  sea_world: {
    generate(count) {
      const all = [
        { word: "fish", emoji: "🐟", sr: "riba" }, { word: "shark", emoji: "🦈", sr: "ajkula" },
        { word: "whale", emoji: "🐳", sr: "kit" }, { word: "dolphin", emoji: "🐬", sr: "delfin" },
        { word: "octopus", emoji: "🐙", sr: "hobotnica" }, { word: "crab", emoji: "🦀", sr: "rak" },
        { word: "starfish", emoji: "⭐", sr: "morska zvezda" }, { word: "jellyfish", emoji: "🪼", sr: "meduza" },
        { word: "turtle", emoji: "🐢", sr: "kornjača" }, { word: "seahorse", emoji: "🐴", sr: "morski konjic" },
        { word: "shell", emoji: "🐚", sr: "školjka" }, { word: "coral", emoji: "🪸", sr: "koral" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže morsko biće na engleskom. Zaokruži odgovarajuću sličicu! 🌊 Nemo je fish, Bruce je shark!",
        teacherNote: "Izgovorite naziv morskog bića 2–3 puta. Deca zaokružuju sličicu.",
        items,
      };
    },
  },

  at_school: {
    generate(count) {
      const all = [
        { word: "teacher", emoji: "🧑‍🏫", sr: "učitelj/ica" }, { word: "pupil", emoji: "🧒", sr: "učenik" },
        { word: "playground", emoji: "🛝", sr: "igralište" }, { word: "break", emoji: "⏰", sr: "odmor" },
        { word: "lesson", emoji: "📖", sr: "čas" }, { word: "homework", emoji: "📝", sr: "domaći" },
        { word: "subject", emoji: "🗂️", sr: "predmet" }, { word: "gym", emoji: "🤸", sr: "fiskultura" },
        { word: "canteen", emoji: "🍽️", sr: "trpezarija" }, { word: "principal", emoji: "🧑‍💼", sr: "direktor" },
        { word: "timetable", emoji: "🗓️", sr: "raspored časova" }, { word: "blackboard", emoji: "🖤", sr: "tabla" },
      ];
      const items = shuffle(all).slice(0, Math.min(count, 12));
      return {
        type: "listen-circle",
        instruction: "Nastavnik kaže reč vezanu za školu na engleskom. Zaokruži odgovarajuću sličicu! 🎒",
        teacherNote: "Izgovorite reč 2–3 puta. Deca zaokružuju sličicu.",
        items,
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

  present_simple_negative: {
    generate(count) {
      const pool = shuffle(PRESENT_SIMPLE_SUBJECTS).slice(0, Math.min(count, PRESENT_SIMPLE_SUBJECTS.length));
      return {
        type: "fillin",
        instruction: "Stavi rečenicu u negaciju koristeći don't ili doesn't.",
        wordBank: ["don't", "doesn't"],
        items: pool.map(p => ({
          sentence: `${p.subject} ___ (not/${p.base}) ${p.rest}.`,
          answer: `${p.thirdSg ? "doesn't" : "don't"} ${p.base}`,
        })),
      };
    },
  },

  present_simple_questions: {
    generate(count) {
      const pool = shuffle(PRESENT_SIMPLE_SUBJECTS).slice(0, Math.min(count, PRESENT_SIMPLE_SUBJECTS.length));
      return {
        type: "fillin",
        instruction: "Napiši pitanje na osnovu rečenice.",
        wordBank: ["Do", "Does"],
        items: pool.map(p => ({
          sentence: `${p.subject} ${p.thirdSg ? conjugate3rdPerson(p.base) : p.base} ${p.rest}. → ___`,
          answer: `${p.thirdSg ? "Does" : "Do"} ${p.subjectInQuestion} ${p.base} ${p.rest}?`,
        })),
      };
    },
  },

  present_simple_short_answers: {
    generate(count) {
      const pool = shuffle(PRESENT_SIMPLE_SUBJECTS).slice(0, Math.min(count, PRESENT_SIMPLE_SUBJECTS.length));
      return {
        type: "fillin",
        instruction: "Odgovori kratkim odgovorom (Yes/No).",
        wordBank: [],
        items: pool.map((p, i) => {
          const isYes = i % 2 === 0;
          const aux = p.thirdSg ? "does" : "do";
          const negAux = p.thirdSg ? "doesn't" : "don't";
          return {
            sentence: `${p.thirdSg ? "Does" : "Do"} ${p.subjectInQuestion} ${p.base} ${p.rest}? (${isYes ? "✓" : "✗"}) → ___`,
            answer: isYes ? `Yes, ${p.pronoun} ${aux}.` : `No, ${p.pronoun} ${negAux}.`,
          };
        }),
      };
    },
  },

  present_continuous: {
    generate(count) {
      const pool = shuffle([
        { sentence: "Mickey ___ (run) in the park now.", answer: "is running", hint: "(Mickey)" },
        { sentence: "I ___ (read) a book right now.", answer: "am reading", hint: "(I)" },
        { sentence: "Minnie and Daisy ___ (dance) at the party.", answer: "are dancing", hint: "(Minnie and Daisy)" },
        { sentence: "You ___ (write) a letter.", answer: "are writing", hint: "(You)" },
        { sentence: "Donald ___ (swim) in the sea.", answer: "is swimming", hint: "(Donald)" },
        { sentence: "We ___ (play) a game together.", answer: "are playing", hint: "(We)" },
        { sentence: "Goofy ___ (cook) dinner right now.", answer: "is cooking", hint: "(Goofy)" },
        { sentence: "The children ___ (sing) a song.", answer: "are singing", hint: "(The children)" },
        { sentence: "Pluto ___ (sleep) under the table.", answer: "is sleeping", hint: "(Pluto)" },
        { sentence: "I ___ (do) my homework at the moment.", answer: "am doing", hint: "(I)" },
        { sentence: "Mickey and Donald ___ (build) a boat.", answer: "are building", hint: "(Mickey and Donald)" },
        { sentence: "She ___ (watch) a cartoon now.", answer: "is watching", hint: "(She)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: "Stavi glagol u Present Continuous (am/is/are + -ing). ⭐ Šta Mickey i prijatelji rade upravo sada?",
        wordBank: ["am", "is", "are"],
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

  will_going_to: {
    generate(count) {
      const pool = shuffle([
        { sentence: "I think it ___ rain tomorrow.", answer: "will", hint: "(predviđanje)" },
        { sentence: "Look at those clouds! It ___ rain.", answer: "is going to", hint: "(vidljiv znak)" },
        { sentence: "Mickey ___ visit his grandma next week.", answer: "is going to", hint: "(plan)" },
        { sentence: "I promise I ___ help you.", answer: "will", hint: "(obećanje)" },
        { sentence: "We ___ go to the beach this summer.", answer: "are going to", hint: "(plan)" },
        { sentence: "Maybe she ___ come to the party.", answer: "will", hint: "(pretpostavka)" },
        { sentence: "Look out! You ___ fall!", answer: "are going to", hint: "(vidljiv znak)" },
        { sentence: "I ___ answer the phone.", answer: "will", hint: "(spontana odluka)" },
        { sentence: "They ___ build a new school next year.", answer: "are going to", hint: "(plan)" },
        { sentence: "I'm sure Donald ___ win the race.", answer: "will", hint: "(pretpostavka)" },
        { sentence: "He ___ study medicine after school.", answer: "is going to", hint: "(plan)" },
        { sentence: "Don't worry, I ___ carry your bag.", answer: "will", hint: "(spontana ponuda)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: 'Popuni rečenicu sa "will" ili odgovarajućim oblikom "be going to".',
        wordBank: ["will", "am going to", "is going to", "are going to"],
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

  past_continuous: {
    generate(count) {
      const pool = shuffle([
        { sentence: "She ___ (read) a book when I called.", answer: "was reading", hint: "(She)" },
        { sentence: "They ___ (play) football at 5 o'clock.", answer: "were playing", hint: "(They)" },
        { sentence: "I ___ (sleep) when the phone rang.", answer: "was sleeping", hint: "(I)" },
        { sentence: "We ___ (watch) TV all evening.", answer: "were watching", hint: "(We)" },
        { sentence: "Mickey ___ (drive) to the clubhouse.", answer: "was driving", hint: "(Mickey)" },
        { sentence: "The children ___ (sing) when the teacher walked in.", answer: "were singing", hint: "(The children)" },
        { sentence: "He ___ (cook) dinner at 7 o'clock yesterday.", answer: "was cooking", hint: "(He)" },
        { sentence: "You ___ (not/listen) to me.", answer: "weren't listening", hint: "(You)" },
        { sentence: "Minnie and Daisy ___ (walk) in the park.", answer: "were walking", hint: "(Minnie and Daisy)" },
        { sentence: "___ it (rain) when you left home?", answer: "Was it raining", hint: "(pitanje)" },
        { sentence: "I ___ (do) my homework when the lights went out.", answer: "was doing", hint: "(I)" },
        { sentence: "She ___ (not/study) at 9 pm.", answer: "wasn't studying", hint: "(She)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: "Stavi glagol u Past Continuous (was/were + -ing). Šta su Mickey i prijatelji radili u tom trenutku?",
        wordBank: ["was", "were"],
        items: pool,
      };
    },
  },

  present_perfect: {
    generate(count) {
      const pool = shuffle([
        { sentence: "I have ___ (see) that movie already.", answer: "seen", hint: "(I)" },
        { sentence: "She has ___ (finish) her homework.", answer: "finished", hint: "(She)" },
        { sentence: "They have ___ (visit) London twice.", answer: "visited", hint: "(They)" },
        { sentence: "Mickey has ___ (eat) all the cookies.", answer: "eaten", hint: "(Mickey)" },
        { sentence: "We have ___ (never/be) to Paris.", answer: "never been", hint: "(We)" },
        { sentence: "Have you ___ (read) this book?", answer: "read", hint: "(pitanje)" },
        { sentence: "He has ___ (lose) his keys.", answer: "lost", hint: "(He)" },
        { sentence: "Minnie has just ___ (make) a cake.", answer: "made", hint: "(Minnie)" },
        { sentence: "I have ___ (not/do) my homework yet.", answer: "not done", hint: "(I)" },
        { sentence: "They have already ___ (leave).", answer: "left", hint: "(They)" },
        { sentence: "Has she ever ___ (be) to the zoo?", answer: "been", hint: "(pitanje)" },
        { sentence: "We have ___ (write) three letters this week.", answer: "written", hint: "(We)" },
      ]).slice(0, Math.min(count, 12));
      return {
        type: "fillin",
        instruction: "Stavi glagol u Present Perfect (have/has + particip). Šta su Mickey i prijatelji već uradili?",
        wordBank: ["have", "has"],
        items: pool,
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
