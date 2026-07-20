/**
 * Pipeline Step 1: Fetch Stephen King Books from Wikipedia
 *
 * Scrapes the Wikipedia bibliography page for all books/collections/stories
 * that have screen adaptations. Builds the book list and maps adaptations
 * to their source material.
 *
 * Usage: npx tsx scripts/01-fetch-books.ts
 */

import 'dotenv/config';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');

// ── Curated book-to-adaptation mapping ──────────────
// Maps Stephen King books to their screen adaptations.
// This is the most reliable approach since TMDB doesn't include book data.

interface BookEntry {
  slug: string;
  title: string;
  titleCn: string | null;
  publicationYear: number;
  type: 'NOVEL' | 'COLLECTION' | 'SHORT_STORY' | 'NOVELLA';
  adaptations: string[]; // TMDB title keywords to match
}

const BOOKS: BookEntry[] = [
  { slug: 'carrie', title: 'Carrie', titleCn: '魔女嘉莉', publicationYear: 1974, type: 'NOVEL', adaptations: ['Carrie', 'The Rage: Carrie 2'] },
  { slug: 'salems-lot', title: "'Salem's Lot", titleCn: '撒冷镇', publicationYear: 1975, type: 'NOVEL', adaptations: ["Salem's Lot", "A Return to Salem's Lot"] },
  { slug: 'the-shining', title: 'The Shining', titleCn: '闪灵', publicationYear: 1977, type: 'NOVEL', adaptations: ['The Shining', 'Doctor Sleep'] },
  { slug: 'the-stand', title: 'The Stand', titleCn: '末日逼近', publicationYear: 1978, type: 'NOVEL', adaptations: ['The Stand'] },
  { slug: 'the-dead-zone', title: 'The Dead Zone', titleCn: '死亡区域', publicationYear: 1979, type: 'NOVEL', adaptations: ['The Dead Zone'] },
  { slug: 'firestarter', title: 'Firestarter', titleCn: '凶火', publicationYear: 1980, type: 'NOVEL', adaptations: ['Firestarter'] },
  { slug: 'cujo', title: 'Cujo', titleCn: '狂犬库乔', publicationYear: 1981, type: 'NOVEL', adaptations: ['Cujo'] },
  { slug: 'christine', title: 'Christine', titleCn: '克里斯汀', publicationYear: 1983, type: 'NOVEL', adaptations: ['Christine'] },
  { slug: 'pet-sematary', title: 'Pet Sematary', titleCn: '宠物公墓', publicationYear: 1983, type: 'NOVEL', adaptations: ['Pet Sematary', 'Pet Sematary II'] },
  { slug: 'cycle-of-the-werewolf', title: 'Cycle of the Werewolf', titleCn: '狼的轮回', publicationYear: 1983, type: 'NOVEL', adaptations: ['Silver Bullet'] },
  { slug: 'the-running-man', title: 'The Running Man', titleCn: '逃亡者', publicationYear: 1982, type: 'NOVEL', adaptations: ['The Running Man'] },
  { slug: 'thinner', title: 'Thinner', titleCn: '瘦到死', publicationYear: 1984, type: 'NOVEL', adaptations: ['Thinner'] },
  { slug: 'it', title: 'It', titleCn: '小丑回魂', publicationYear: 1986, type: 'NOVEL', adaptations: ['It', 'It Chapter Two'] },
  { slug: 'misery', title: 'Misery', titleCn: '危情十日', publicationYear: 1987, type: 'NOVEL', adaptations: ['Misery'] },
  { slug: 'the-tommyknockers', title: 'The Tommyknockers', titleCn: '绿魔', publicationYear: 1987, type: 'NOVEL', adaptations: [] },
  { slug: 'the-dark-half', title: 'The Dark Half', titleCn: '黑暗的另一半', publicationYear: 1989, type: 'NOVEL', adaptations: ['The Dark Half'] },
  { slug: 'needful-things', title: 'Needful Things', titleCn: '必需品', publicationYear: 1991, type: 'NOVEL', adaptations: ['Needful Things'] },
  { slug: 'dolores-claiborne', title: 'Dolores Claiborne', titleCn: '热泪伤痕', publicationYear: 1992, type: 'NOVEL', adaptations: ['Dolores Claiborne'] },
  { slug: 'gerald-game', title: "Gerald's Game", titleCn: '杰罗德游戏', publicationYear: 1992, type: 'NOVEL', adaptations: ["Gerald's Game"] },
  { slug: 'insomnia', title: 'Insomnia', titleCn: '失眠', publicationYear: 1994, type: 'NOVEL', adaptations: [] },
  { slug: 'the-green-mile', title: 'The Green Mile', titleCn: '绿里奇迹', publicationYear: 1996, type: 'NOVEL', adaptations: ['The Green Mile'] },
  { slug: 'desperation', title: 'Desperation', titleCn: '绝望', publicationYear: 1996, type: 'NOVEL', adaptations: ['Desperation'] },
  { slug: 'bag-of-bones', title: 'Bag of Bones', titleCn: '尸骨袋', publicationYear: 1998, type: 'NOVEL', adaptations: [] },
  { slug: 'the-girl-who-loved-tom-gordon', title: 'The Girl Who Loved Tom Gordon', titleCn: '爱上汤姆·戈登的女孩', publicationYear: 1999, type: 'NOVEL', adaptations: [] },
  { slug: 'dreamcatcher', title: 'Dreamcatcher', titleCn: '捕梦网', publicationYear: 2001, type: 'NOVEL', adaptations: ['Dreamcatcher'] },
  { slug: 'from-a-buick-8', title: 'From a Buick 8', titleCn: '别克8号', publicationYear: 2002, type: 'NOVEL', adaptations: [] },
  { slug: 'cell', title: 'Cell', titleCn: '手机', publicationYear: 2006, type: 'NOVEL', adaptations: ['Cell'] },
  { slug: 'liseys-story', title: "Lisey's Story", titleCn: '莉西的故事', publicationYear: 2006, type: 'NOVEL', adaptations: [] },
  { slug: 'duma-key', title: 'Duma Key', titleCn: '杜马岛', publicationYear: 2008, type: 'NOVEL', adaptations: [] },
  { slug: 'under-the-dome', title: 'Under the Dome', titleCn: '穹顶之下', publicationYear: 2009, type: 'NOVEL', adaptations: ['Under the Dome'] },
  { slug: '11-22-63', title: '11/22/63', titleCn: '拯救肯尼迪', publicationYear: 2011, type: 'NOVEL', adaptations: ['11.22.63'] },
  { slug: 'doctor-sleep', title: 'Doctor Sleep', titleCn: '睡梦医生', publicationYear: 2013, type: 'NOVEL', adaptations: ['Doctor Sleep'] },
  { slug: 'mr-mercedes', title: 'Mr. Mercedes', titleCn: '梅赛德斯先生', publicationYear: 2014, type: 'NOVEL', adaptations: ['Mr. Mercedes'] },
  { slug: 'finders-keepers', title: 'Finders Keepers', titleCn: '先到先得', publicationYear: 2015, type: 'NOVEL', adaptations: [] },
  { slug: 'end-of-watch', title: 'End of Watch', titleCn: '守夜', publicationYear: 2016, type: 'NOVEL', adaptations: [] },
  { slug: 'the-outsider', title: 'The Outsider', titleCn: '局外人', publicationYear: 2018, type: 'NOVEL', adaptations: [] },
  { slug: 'the-institute', title: 'The Institute', titleCn: '研究所', publicationYear: 2019, type: 'NOVEL', adaptations: [] },
  { slug: 'fairy-tale', title: 'Fairy Tale', titleCn: '童话', publicationYear: 2022, type: 'NOVEL', adaptations: [] },
  { slug: 'holly', title: 'Holly', titleCn: '霍莉', publicationYear: 2023, type: 'NOVEL', adaptations: [] },

  // Collections
  { slug: 'night-shift', title: 'Night Shift', titleCn: '夜班', publicationYear: 1978, type: 'COLLECTION', adaptations: ['Children of the Corn', 'Trucks', 'The Mangler', 'Graveyard Shift', 'Sometimes They Come Back', "The Woman in the Room", "Quicksilver Highway"] },
  { slug: 'different-seasons', title: 'Different Seasons', titleCn: '四季奇谭', publicationYear: 1982, type: 'COLLECTION', adaptations: ['The Shawshank Redemption', 'Stand by Me', 'Apt Pupil'] },
  { slug: 'skeleton-crew', title: 'Skeleton Crew', titleCn: '骷髅船员', publicationYear: 1985, type: 'COLLECTION', adaptations: ['The Mist'] },
  { slug: 'four-past-midnight', title: 'Four Past Midnight', titleCn: '午夜四点', publicationYear: 1990, type: 'COLLECTION', adaptations: ['Secret Window', 'The Night Flier'] },
  { slug: 'nightmares-and-dreamscapes', title: 'Nightmares & Dreamscapes', titleCn: '噩梦与梦境', publicationYear: 1993, type: 'COLLECTION', adaptations: ['Dolan\'s Cadillac'] },
  { slug: 'hearts-in-atlantis', title: 'Hearts in Atlantis', titleCn: '亚特兰蒂斯之心', publicationYear: 1999, type: 'COLLECTION', adaptations: ['Hearts in Atlantis'] },
  { slug: 'everythings-eventual', title: "Everything's Eventual", titleCn: '世事无常', publicationYear: 2002, type: 'COLLECTION', adaptations: ['1408', 'Riding the Bullet'] },
  { slug: 'just-after-sunset', title: 'Just After Sunset', titleCn: '日落之后', publicationYear: 2008, type: 'COLLECTION', adaptations: [] },
  { slug: 'full-dark-no-stars', title: 'Full Dark, No Stars', titleCn: '暗夜无星', publicationYear: 2010, type: 'COLLECTION', adaptations: ['Big Driver', 'A Good Marriage'] },
  { slug: 'bazaar-of-bad-dreams', title: 'The Bazaar of Bad Dreams', titleCn: '噩梦集市', publicationYear: 2015, type: 'COLLECTION', adaptations: [] },
  { slug: 'if-it-bleeds', title: 'If It Bleeds', titleCn: '如果流血', publicationYear: 2020, type: 'COLLECTION', adaptations: [] },
  { slug: 'you-like-it-darker', title: 'You Like It Darker', titleCn: '你喜欢更黑暗', publicationYear: 2024, type: 'COLLECTION', adaptations: [] },

  // Novellas / Short Stories (standalone)
  { slug: 'the-long-walk', title: 'The Long Walk', titleCn: '大逃杀', publicationYear: 1979, type: 'NOVELLA', adaptations: ['The Long Walk'] },
  { slug: 'the-lawnmower-man', title: 'The Lawnmower Man', titleCn: '割草人', publicationYear: 1978, type: 'SHORT_STORY', adaptations: ['The Lawnmower Man', 'Lawnmower Man 2'] },

  // Dark Tower
  { slug: 'the-dark-tower', title: 'The Dark Tower', titleCn: '黑暗塔', publicationYear: 1982, type: 'NOVEL', adaptations: ['The Dark Tower'] },

  // Other original screenplays / non-book sources
  { slug: 'creepshow', title: 'Creepshow', titleCn: '鬼作秀', publicationYear: 1982, type: 'COLLECTION', adaptations: ['Creepshow', 'Creepshow 2', 'Creepshow 3'] },
  { slug: 'cats-eye', title: "Cat's Eye", titleCn: '猫眼', publicationYear: 1985, type: 'SHORT_STORY', adaptations: ["Cat's Eye"] },
  { slug: 'sleepwalkers', title: 'Sleepwalkers', titleCn: '梦游者', publicationYear: 1992, type: 'NOVEL', adaptations: ['Sleepwalkers'] },
  { slug: 'golden-years', title: 'Golden Years', titleCn: '黄金岁月', publicationYear: 1991, type: 'NOVEL', adaptations: ['Golden Years'] },
  { slug: 'in-the-tall-grass', title: 'In the Tall Grass', titleCn: '高草丛中', publicationYear: 2012, type: 'NOVELLA', adaptations: ['In the Tall Grass'] },
  { slug: 'mercy', title: 'Mercy', titleCn: '慈悲', publicationYear: 1984, type: 'SHORT_STORY', adaptations: ['Mercy'] },
  { slug: 'no-smoking', title: 'No Smoking', titleCn: '禁止吸烟', publicationYear: 1978, type: 'SHORT_STORY', adaptations: ['No Smoking'] },
  { slug: '1922', title: '1922', titleCn: '1922', publicationYear: 2010, type: 'NOVELLA', adaptations: ['1922'] },
  { slug: 'a-good-marriage', title: 'A Good Marriage', titleCn: '美满婚姻', publicationYear: 2010, type: 'NOVELLA', adaptations: ['A Good Marriage'] },
  { slug: 'big-driver', title: 'Big Driver', titleCn: '大司机', publicationYear: 2010, type: 'NOVELLA', adaptations: ['Big Driver'] },
  { slug: 'the-diary-of-ellen-rimbauer', title: 'The Diary of Ellen Rimbauer', titleCn: '艾伦·林鲍尔的日记', publicationYear: 2001, type: 'NOVEL', adaptations: ['The Diary of Ellen Rimbauer'] },
  { slug: 'kingdom-hospital', title: 'Kingdom Hospital', titleCn: '王国医院', publicationYear: 2004, type: 'NOVEL', adaptations: ['Kingdom Hospital'] },
  { slug: 'haven', title: 'Haven', titleCn: '港湾', publicationYear: 2010, type: 'NOVEL', adaptations: ['Haven'] },
  { slug: 'castle-rock', title: 'Castle Rock', titleCn: '城堡岩', publicationYear: 2018, type: 'NOVEL', adaptations: ['Castle Rock'] },
  { slug: 'the-mist', title: 'The Mist', titleCn: '迷雾', publicationYear: 1980, type: 'NOVELLA', adaptations: ['The Mist'] },
  { slug: 'trucks', title: 'Trucks', titleCn: '卡车', publicationYear: 1973, type: 'SHORT_STORY', adaptations: ['Trucks'] },
  { slug: 'the-mangler', title: 'The Mangler', titleCn: '绞肉机', publicationYear: 1972, type: 'SHORT_STORY', adaptations: ['The Mangler', 'The Mangler 2', 'The Mangler Reborn'] },
  { slug: 'graveyard-shift', title: 'Graveyard Shift', titleCn: '夜班', publicationYear: 1970, type: 'SHORT_STORY', adaptations: ['Graveyard Shift'] },
  { slug: 'sometimes-they-come-back', title: 'Sometimes They Come Back', titleCn: '有时他们会回来', publicationYear: 1974, type: 'SHORT_STORY', adaptations: ['Sometimes They Come Back', 'Sometimes They Come Back... Again', 'Sometimes They Come Back... for More'] },
  { slug: 'the-woman-in-the-room', title: 'The Woman in the Room', titleCn: '房间里的女人', publicationYear: 1978, type: 'SHORT_STORY', adaptations: ['The Woman in the Room'] },
  { slug: 'quicksilver-highway', title: 'Quicksilver Highway', titleCn: '水银公路', publicationYear: 1997, type: 'SHORT_STORY', adaptations: ['Quicksilver Highway'] },
  { slug: 'the-night-flier', title: 'The Night Flier', titleCn: '夜航者', publicationYear: 1988, type: 'SHORT_STORY', adaptations: ['The Night Flier'] },
  { slug: 'riding-the-bullet', title: 'Riding the Bullet', titleCn: '骑弹飞行', publicationYear: 2000, type: 'SHORT_STORY', adaptations: ['Riding the Bullet'] },
  { slug: 'secret-window-secret-garden', title: 'Secret Window, Secret Garden', titleCn: '秘密窗，秘密园', publicationYear: 1990, type: 'NOVELLA', adaptations: ['Secret Window'] },
  { slug: '1408', title: '1408', titleCn: '1408房间', publicationYear: 1999, type: 'SHORT_STORY', adaptations: ['1408'] },
  { slug: 'dolans-cadillac', title: "Dolan's Cadillac", titleCn: '多兰的凯迪拉克', publicationYear: 1989, type: 'SHORT_STORY', adaptations: ["Dolan's Cadillac"] },
  { slug: 'hearts-in-atlantis-2', title: 'Low Men in Yellow Coats', titleCn: '穿黄雨衣的下等人', publicationYear: 1999, type: 'NOVELLA', adaptations: ['Hearts in Atlantis'] },
  { slug: 'apt-pupil', title: 'Apt Pupil', titleCn: '纳粹追凶', publicationYear: 1982, type: 'NOVELLA', adaptations: ['Apt Pupil'] },
  { slug: 'maximum-overdrive', title: 'Maximum Overdrive', titleCn: '火魔战车', publicationYear: 1986, type: 'SHORT_STORY', adaptations: ['Maximum Overdrive'] },
  { slug: 'the-rage-carrie-2', title: 'The Rage: Carrie 2', titleCn: '狂怒：魔女嘉莉2', publicationYear: 1999, type: 'NOVEL', adaptations: ['The Rage: Carrie 2'] },
  { slug: 'desperation-regulators', title: 'The Regulators', titleCn: '监管者', publicationYear: 1996, type: 'NOVEL', adaptations: [] },
];

async function main() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  console.log(`📚 Built ${BOOKS.length} book records with adaptation mappings\n`);

  // Count how many adaptations are covered
  const mappedTitles = new Set<string>();
  BOOKS.forEach(b => b.adaptations.forEach(a => mappedTitles.add(a.toLowerCase())));
  console.log(`   Mapped ${mappedTitles.size} adaptation titles to books`);

  writeFileSync(path.join(DATA_DIR, 'books.json'), JSON.stringify(BOOKS, null, 2), 'utf-8');
  console.log(`   Saved to data/books.json\n`);
}

main();
