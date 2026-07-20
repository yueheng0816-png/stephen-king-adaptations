/**
 * Manual Seed — Top 10 Stephen King Adaptations
 *
 * Instant demo data so the site works without running the full pipeline.
 * Run: npx tsx prisma/seed-manual.ts
 *
 * Once API keys are set up, the pipeline will add the remaining ~100 adaptations.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_DATA = [
  {
    book: { title: 'Rita Hayworth and Shawshank Redemption', slug: 'rita-hayworth-and-shawshank-redemption', publicationYear: 1982, type: 'NOVELLA' },
    adaptation: {
      slug: 'the-shawshank-redemption', title: 'The Shawshank Redemption', titleCn: '肖申克的救赎',
      type: 'MOVIE', releaseYear: 1994, releaseDate: '1994-09-23', runtime: 142,
      overview: 'Imprisoned in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison, where he puts his accounting skills to work for an unprincipled warden.',
      overviewCn: '20世纪40年代，正直的银行家安迪·杜佛兰因被误判杀害妻子及其情人而入狱。在肖申克监狱中，他利用自己的会计技能为腐败的监狱长工作，同时用二十年时间策划了一场惊天越狱。',
      tmdbId: 278,
      imdbId: 'tt0111161',
      rating: 9.3,
      ratingCount: 2900000,
      mpaaRating: 'R',
      review: `## 评价分析\n\n《肖申克的救赎》被广泛认为是有史以来最伟大的电影之一。改编自 Stephen King 在《四季奇谭》(Different Seasons) 中的中篇小说《丽塔·海华丝与肖申克的救赎》。\n\n导演弗兰克·德拉邦特以细腻的叙事手法，将监狱题材升华为关于希望、友谊和人性尊严的普世寓言。蒂姆·罗宾斯和摩根·弗里曼的表演堪称教科书级别。\n\n尽管当年票房表现平平，但通过录像带和电视重播积累了口碑，如今 IMDb 评分高达 9.3/10，长期占据榜首。\n\n**获奖**: 7项奥斯卡提名，包括最佳影片、最佳男主角（摩根·弗里曼）。`,
    },
    director: { name: 'Frank Darabont', slug: 'frank-darabont', tmdbId: 1524, role: 'DIRECTOR' },
    cast: [
      { name: 'Tim Robbins', character: 'Andy Dufresne', order: 0 },
      { name: 'Morgan Freeman', character: 'Ellis Boyd "Red" Redding', order: 1 },
      { name: 'Bob Gunton', character: 'Warden Samuel Norton', order: 2 },
    ],
    ratings: [
      { source: 'IMDB', score: 9.3, maxScore: 10, voteCount: 2900000 },
      { source: 'ROTTEN_TOMATOES', score: 89, maxScore: 100, voteCount: null },
      { source: 'METACRITIC', score: 82, maxScore: 100, voteCount: null },
    ],
  },
  {
    book: { title: 'The Green Mile', slug: 'the-green-mile', publicationYear: 1996, type: 'NOVEL' },
    adaptation: {
      slug: 'the-green-mile', title: 'The Green Mile', titleCn: '绿里奇迹',
      type: 'MOVIE', releaseYear: 1999, releaseDate: '1999-12-10', runtime: 189,
      overview: "A supernatural tale set on death row in a Southern prison, where gentle giant John Coffey possesses the mysterious power to heal people's ailments. When the cellblock's head guard realizes Coffey's gift, he tries to help stave off the condemned man's execution.",
      overviewCn: '南方监狱的死囚区，身材魁梧的约翰·科菲拥有神秘的治愈能力。当狱警保罗·艾吉康比发现科菲的天赋后，他试图阻止这位无辜之人被处决。',
      tmdbId: 497,
      imdbId: 'tt0120689',
      rating: 8.6,
      ratingCount: 1400000,
      mpaaRating: 'R',
      review: `## 评价分析\n\n《绿里奇迹》是弗兰克·德拉邦特继《肖申克的救赎》后第二次改编 Stephen King 的作品，同样取得了巨大成功。\n\n汤姆·汉克斯领衔主演，迈克尔·克拉克·邓肯饰演的约翰·科菲成为影史经典角色之一。影片将监狱题材与超自然元素融合，探讨了正义、死亡和奇迹的主题。\n\n片长189分钟，是当时最长的主流电影之一，但节奏把控精准，情感张力十足。`,
    },
    director: { name: 'Frank Darabont', slug: 'frank-darabont', tmdbId: 1524, role: 'BOTH' },
    cast: [
      { name: 'Tom Hanks', character: 'Paul Edgecomb', order: 0 },
      { name: 'Michael Clarke Duncan', character: 'John Coffey', order: 1 },
      { name: 'David Morse', character: 'Brutus "Brutal" Howell', order: 2 },
    ],
    ratings: [
      { source: 'IMDB', score: 8.6, maxScore: 10, voteCount: 1400000 },
      { source: 'ROTTEN_TOMATOES', score: 79, maxScore: 100, voteCount: null },
      { source: 'METACRITIC', score: 61, maxScore: 100, voteCount: null },
    ],
  },
  {
    book: { title: 'The Shining', slug: 'the-shining', publicationYear: 1977, type: 'NOVEL' },
    adaptation: {
      slug: 'the-shining', title: 'The Shining', titleCn: '闪灵',
      type: 'MOVIE', releaseYear: 1980, releaseDate: '1980-05-23', runtime: 146,
      overview: 'Jack Torrance accepts a caretaker job at the Overlook Hotel, where he, along with his wife Wendy and their son Danny, must live isolated from the rest of the world for the winter. But the hotel has a dark history and supernatural forces that begin to unravel Jack\'s sanity.',
      overviewCn: '杰克·托伦斯带着妻儿来到与世隔绝的眺望旅馆担任冬季看管员。旅馆超自然的力量逐渐侵蚀了杰克的理智，将他推向疯狂。',
      tmdbId: 694,
      imdbId: 'tt0081505',
      rating: 8.4,
      ratingCount: 1100000,
      mpaaRating: 'R',
      review: `## 评价分析\n\n斯坦利·库布里克执导的《闪灵》是恐怖电影史上最具影响力的作品之一，虽然 Stephen King 本人对改编非常不满。\n\n库布里克将 King 的个人恶魔寓言转化为关于孤立、疯狂和家庭暴力的视觉盛宴。杰克·尼科尔森的表演定义了"疯狂"在大银幕上的呈现方式。\n\n电影的歧义性和丰富的象征意义使其成为最具分析价值的恐怖片之一。纪录片《237号房间》专门探讨了影迷对此片的各种解读。\n\n**与原著的主要差异**: King 原著强调杰克的内心挣扎和酗酒问题，库布里克则更关注超自然力量和家庭暴力的循环。King 认为电影中的杰克从一开始就显露出疯狂，缺乏原著中渐进的悲剧感。`,
    },
    director: { name: 'Stanley Kubrick', slug: 'stanley-kubrick', tmdbId: 240, role: 'DIRECTOR' },
    cast: [
      { name: 'Jack Nicholson', character: 'Jack Torrance', order: 0 },
      { name: 'Shelley Duvall', character: 'Wendy Torrance', order: 1 },
      { name: 'Danny Lloyd', character: 'Danny Torrance', order: 2 },
    ],
    ratings: [
      { source: 'IMDB', score: 8.4, maxScore: 10, voteCount: 1100000 },
      { source: 'ROTTEN_TOMATOES', score: 84, maxScore: 100, voteCount: null },
      { source: 'METACRITIC', score: 66, maxScore: 100, voteCount: null },
    ],
  },
  {
    book: { title: 'Misery', slug: 'misery', publicationYear: 1987, type: 'NOVEL' },
    adaptation: {
      slug: 'misery', title: 'Misery', titleCn: '危情十日',
      type: 'MOVIE', releaseYear: 1990, releaseDate: '1990-11-30', runtime: 107,
      overview: "After a famous author is rescued from a car crash by a fan of his novels, he comes to realize that the care he is receiving is only the beginning of a nightmare of captivity and abuse.",
      overviewCn: '知名作家保罗·谢尔顿遭遇车祸后被一位狂热女粉丝"救助"，却发现这场"照顾"是一场囚禁和虐待的噩梦。',
      tmdbId: 1700,
      imdbId: 'tt0100157',
      rating: 7.8,
      ratingCount: 235000,
      mpaaRating: 'R',
      review: `## 评价分析\n\n《危情十日》是 Stephen King 改编作品中的里程碑——它是唯一一部获得奥斯卡表演奖的 King 改编作品。\n\n凯西·贝茨饰演的安妮·威尔克斯是电影史上最令人难忘的反派之一，她凭借这个角色获得了奥斯卡最佳女主角奖。\n\n导演罗伯·雷纳完美捕捉了 King 原著中的幽闭恐惧和心理折磨，詹姆斯的表演也在恐惧和挣扎之间找到了微妙的平衡。`,
    },
    director: { name: 'Rob Reiner', slug: 'rob-reiner', tmdbId: 16575, role: 'DIRECTOR' },
    cast: [
      { name: 'James Caan', character: 'Paul Sheldon', order: 0 },
      { name: 'Kathy Bates', character: 'Annie Wilkes', order: 1 },
      { name: 'Richard Farnsworth', character: 'Buster', order: 2 },
    ],
    ratings: [
      { source: 'IMDB', score: 7.8, maxScore: 10, voteCount: 235000 },
      { source: 'ROTTEN_TOMATOES', score: 91, maxScore: 100, voteCount: null },
      { source: 'METACRITIC', score: 75, maxScore: 100, voteCount: null },
    ],
  },
  {
    book: { title: 'It', slug: 'it', publicationYear: 1986, type: 'NOVEL' },
    adaptation: {
      slug: 'it-2017', title: 'It', titleCn: '小丑回魂',
      type: 'MOVIE', releaseYear: 2017, releaseDate: '2017-09-08', runtime: 135,
      overview: 'In the summer of 1989, a group of bullied kids band together to destroy a shape-shifting monster, which disguises itself as a clown and preys on the children of Derry, their small Maine town.',
      overviewCn: '1989年夏天，缅因州德里镇的一群受欺凌的孩子团结起来对抗一个变形怪物，这个怪物以小丑的模样出现，捕食镇上的儿童。',
      tmdbId: 346364,
      imdbId: 'tt1396484',
      rating: 7.3,
      ratingCount: 620000,
      mpaaRating: 'R',
      review: `## 评价分析\n\n2017年《小丑回魂》是 Stephen King 最卖座的改编电影，全球票房超过7亿美元。\n\n导演安德斯·穆斯切蒂将 King 巨著的前半部分（童年篇）改编为一部兼具恐怖与温情的成长故事。比尔·斯卡斯加德饰演的潘尼怀斯成为新一代恐怖偶像。\n\n电影成功的关键在于既保留了 King 式的童年视角，又加入了现代恐怖片的视觉冲击力。续集《It: Chapter Two》(2019) 改编了后半部分（成年篇），但口碑不及第一部。`,
    },
    director: { name: 'Andy Muschietti', slug: 'andy-muschietti', tmdbId: 111476, role: 'DIRECTOR' },
    cast: [
      { name: 'Bill Skarsgård', character: 'Pennywise', order: 0 },
      { name: 'Jaeden Martell', character: 'Bill Denbrough', order: 1 },
      { name: 'Sophia Lillis', character: 'Beverly Marsh', order: 2 },
    ],
    ratings: [
      { source: 'IMDB', score: 7.3, maxScore: 10, voteCount: 620000 },
      { source: 'ROTTEN_TOMATOES', score: 85, maxScore: 100, voteCount: null },
      { source: 'METACRITIC', score: 69, maxScore: 100, voteCount: null },
    ],
  },
  {
    book: { title: 'Carrie', slug: 'carrie', publicationYear: 1974, type: 'NOVEL' },
    adaptation: {
      slug: 'carrie-1976', title: 'Carrie', titleCn: '魔女嘉莉',
      type: 'MOVIE', releaseYear: 1976, releaseDate: '1976-11-03', runtime: 98,
      overview: 'A shy, friendless teenage girl who is sheltered by her domineering, religious mother unleashes her telekinetic powers after being humiliated by her classmates at her senior prom.',
      overviewCn: '一个害羞、没有朋友的少女在毕业舞会上遭到同学羞辱后，释放了她的念力，对小镇展开了毁灭性的报复。',
      tmdbId: 7340,
      imdbId: 'tt0074285',
      rating: 7.4,
      ratingCount: 210000,
      mpaaRating: 'R',
      review: `## 评价分析\n\n《魔女嘉莉》是第一部 Stephen King 长篇改编电影，也是他最成功的处女作。\n\n导演布莱恩·德·帕尔玛将 King 的恐怖与自己的视觉风格融合，创造出了影史上最令人难忘的毕业舞会场景。茜茜·斯派塞克和派珀·劳瑞双双获得奥斯卡提名。\n\n这部电影开创了 Stephen King 改编电影的类型，证明了恐怖片也可以获得主流奖项的认可。`,
    },
    director: { name: 'Brian De Palma', slug: 'brian-de-palma', tmdbId: 2835, role: 'DIRECTOR' },
    cast: [
      { name: 'Sissy Spacek', character: 'Carrie White', order: 0 },
      { name: 'Piper Laurie', character: 'Margaret White', order: 1 },
      { name: 'Amy Irving', character: 'Sue Snell', order: 2 },
    ],
    ratings: [
      { source: 'IMDB', score: 7.4, maxScore: 10, voteCount: 210000 },
      { source: 'ROTTEN_TOMATOES', score: 93, maxScore: 100, voteCount: null },
      { source: 'METACRITIC', score: 85, maxScore: 100, voteCount: null },
    ],
  },
  {
    book: { title: 'Different Seasons', slug: 'different-seasons', publicationYear: 1982, type: 'COLLECTION' },
    adaptation: {
      slug: 'stand-by-me', title: 'Stand by Me', titleCn: '伴我同行',
      type: 'MOVIE', releaseYear: 1986, releaseDate: '1986-08-22', runtime: 89,
      overview: 'After learning that a stranger has been accidentally killed near their rural homes, four Oregon boys decide to go see the body. On the way, Gordie Lachance, the narrator, confronts the pressure of his parent\'s expectations.',
      overviewCn: '四个俄勒冈男孩听说附近有一具尸体后，决定一起踏上寻找之旅。在路上，他们面对各自的恐惧和家庭的期望。',
      tmdbId: 235,
      imdbId: 'tt0092005',
      rating: 8.1,
      ratingCount: 450000,
      mpaaRating: 'R',
    },
    director: { name: 'Rob Reiner', slug: 'rob-reiner', tmdbId: 16575, role: 'BOTH' },
    cast: [
      { name: 'Wil Wheaton', character: 'Gordie Lachance', order: 0 },
      { name: 'River Phoenix', character: 'Chris Chambers', order: 1 },
      { name: 'Corey Feldman', character: 'Teddy Duchamp', order: 2 },
    ],
    ratings: [
      { source: 'IMDB', score: 8.1, maxScore: 10, voteCount: 450000 },
      { source: 'ROTTEN_TOMATOES', score: 92, maxScore: 100, voteCount: null },
      { source: 'METACRITIC', score: 75, maxScore: 100, voteCount: null },
    ],
  },
  {
    book: { title: 'Doctor Sleep', slug: 'doctor-sleep', publicationYear: 2013, type: 'NOVEL' },
    adaptation: {
      slug: 'doctor-sleep', title: 'Doctor Sleep', titleCn: '睡梦医生',
      type: 'MOVIE', releaseYear: 2019, releaseDate: '2019-11-08', runtime: 152,
      overview: 'Dan Torrance remains traumatized by the sinister events that occurred at the Overlook Hotel when he was a child. Now an adult, he meets a young girl who shares his extrasensory gift of the "shine" and tries to protect her from a cult.',
      overviewCn: '成年后的丹·托伦斯仍然被儿时在眺望旅馆的阴影困扰。他遇到了一位同样拥有"闪灵"能力的小女孩，并试图保护她免受一个邪教的伤害。',
      tmdbId: 501170,
      imdbId: 'tt5606664',
      rating: 7.3,
      ratingCount: 215000,
      mpaaRating: 'R',
    },
    director: { name: 'Mike Flanagan', slug: 'mike-flanagan', tmdbId: 930009, role: 'DIRECTOR' },
    cast: [
      { name: 'Ewan McGregor', character: 'Dan Torrance', order: 0 },
      { name: 'Rebecca Ferguson', character: 'Rose the Hat', order: 1 },
      { name: 'Kyliegh Curran', character: 'Abra Stone', order: 2 },
    ],
    ratings: [
      { source: 'IMDB', score: 7.3, maxScore: 10, voteCount: 215000 },
      { source: 'ROTTEN_TOMATOES', score: 78, maxScore: 100, voteCount: null },
      { source: 'METACRITIC', score: 59, maxScore: 100, voteCount: null },
    ],
  },
  {
    book: { title: 'Different Seasons', slug: 'different-seasons', publicationYear: 1982, type: 'COLLECTION' },
    adaptation: {
      slug: 'apt-pupil', title: 'Apt Pupil', titleCn: '纳粹追凶',
      type: 'MOVIE', releaseYear: 1998, releaseDate: '1998-10-23', runtime: 111,
      overview: 'A boy blackmails his neighbor, a Nazi war criminal, into telling him about his wartime experiences, leading to a disturbing and dangerous relationship.',
      overviewCn: '一个男孩发现邻居是纳粹战犯后，以告发相威胁，强迫对方讲述战争经历，两人之间形成了令人不安的危险关系。',
      tmdbId: 10220,
      imdbId: 'tt0118636',
      rating: 6.7,
      ratingCount: 43000,
      mpaaRating: 'R',
    },
    director: { name: 'Bryan Singer', slug: 'bryan-singer', tmdbId: 9033, role: 'DIRECTOR' },
    cast: [
      { name: 'Ian McKellen', character: 'Kurt Dussander', order: 0 },
      { name: 'Brad Renfro', character: 'Todd Bowden', order: 1 },
    ],
    ratings: [
      { source: 'IMDB', score: 6.7, maxScore: 10, voteCount: 43000 },
      { source: 'ROTTEN_TOMATOES', score: 53, maxScore: 100, voteCount: null },
    ],
  },
  {
    book: { title: '11/22/63', slug: '11-22-63', publicationYear: 2011, type: 'NOVEL' },
    adaptation: {
      slug: '11-22-63', title: '11.22.63', titleCn: '拯救肯尼迪',
      type: 'MINISERIES', releaseYear: 2016, releaseDate: '2016-02-15', runtime: 60,
      overview: 'A high school teacher travels back in time to prevent the assassination of President John F. Kennedy, but his mission is threatened by Lee Harvey Oswald, his falling in love, and the past itself which doesn\'t want to be changed.',
      overviewCn: '一位高中英语老师穿越回1960年代，试图阻止肯尼迪总统遇刺。但他的任务面临三重威胁：李·哈维·奥斯瓦尔德、一段意外的爱情，以及不愿被改变的"过去"本身。',
      tmdbId: 63057,
      imdbId: 'tt2879552',
      rating: 8.1,
      ratingCount: 100000,
      mpaaRating: 'TV-MA',
    },
    director: null,
    cast: [
      { name: 'James Franco', character: 'Jake Epping', order: 0 },
      { name: 'Sarah Gadon', character: 'Sadie Dunhill', order: 1 },
      { name: 'George MacKay', character: 'Bill Turcotte', order: 2 },
    ],
    ratings: [
      { source: 'IMDB', score: 8.1, maxScore: 10, voteCount: 100000 },
      { source: 'ROTTEN_TOMATOES', score: 83, maxScore: 100, voteCount: null },
      { source: 'METACRITIC', score: 69, maxScore: 100, voteCount: null },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding demo data — Top 10 Stephen King Adaptations...\n');

  // Clear existing data
  await prisma.bookDifference.deleteMany();
  await prisma.streamingLink.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.castMember.deleteMany();
  await prisma.adaptation.deleteMany();
  await prisma.person.deleteMany();
  await prisma.book.deleteMany();

  for (const item of SEED_DATA) {
    // Upsert book
    const book = await prisma.book.upsert({
      where: { slug: item.book.slug },
      update: item.book,
      create: item.book,
    });

    // Upsert director
    let directorId: string | null = null;
    if (item.director) {
      const director = await prisma.person.upsert({
        where: { tmdbId: item.director.tmdbId },
        update: { name: item.director.name, role: item.director.role },
        create: {
          slug: item.director.slug,
          name: item.director.name,
          tmdbId: item.director.tmdbId,
          role: item.director.role,
        },
      });
      directorId = director.id;
    }

    // Upsert adaptation
    const adaptation = await prisma.adaptation.upsert({
      where: { slug: item.adaptation.slug },
      update: {
        ...item.adaptation,
        bookId: book.id,
        directorId,
      },
      create: {
        ...item.adaptation,
        bookId: book.id,
        directorId,
      },
    });

    // Upsert cast
    for (const actor of item.cast) {
      const actorSlug = actor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const person = await prisma.person.upsert({
        where: { slug: actorSlug },
        update: { name: actor.name },
        create: { slug: actorSlug, name: actor.name, role: 'ACTOR' },
      });

      await prisma.castMember.upsert({
        where: {
          adaptationId_personId: {
            adaptationId: adaptation.id,
            personId: person.id,
          },
        },
        update: { characterName: actor.character, order: actor.order },
        create: {
          adaptationId: adaptation.id,
          personId: person.id,
          characterName: actor.character,
          order: actor.order,
        },
      });
    }

    // Upsert ratings
    for (const r of item.ratings) {
      await prisma.rating.upsert({
        where: {
          adaptationId_source: {
            adaptationId: adaptation.id,
            source: r.source,
          },
        },
        update: r,
        create: {
          adaptationId: adaptation.id,
          source: r.source,
          score: r.score,
          maxScore: r.maxScore,
          voteCount: r.voteCount,
        },
      });
    }

    console.log(`  ✅ ${item.adaptation.title} (${item.adaptation.releaseYear})`);
  }

  const counts = await Promise.all([
    prisma.adaptation.count(),
    prisma.book.count(),
    prisma.person.count(),
    prisma.rating.count(),
  ]);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Demo data seeded!`);
  console.log(`   🎬 ${counts[0]} adaptations`);
  console.log(`   📚 ${counts[1]} books`);
  console.log(`   👤 ${counts[2]} people`);
  console.log(`   ⭐ ${counts[3]} ratings`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
