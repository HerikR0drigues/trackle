/**
 * Seeds the Postgres database. Two-phase, fully idempotent:
 *
 * 1. Bootstrap (one-time): if the SeedTerm table is empty, ensures Flavor rows
 *    exist and inserts the curated search terms below into SeedTerm with
 *    status=pending. After this, the DB is the source of truth for terms.
 *
 * 2. Process: for each flavor, fetches SeedTerm rows where status IN
 *    (pending, failed) and queries the iTunes API for each. On success,
 *    upserts tracks and marks the term success. On error, marks the term
 *    failed and stores the error.
 *
 * Re-running the seed only retries pending+failed terms — nothing already
 * successful is queried again. To grow the pool, insert new SeedTerm rows
 * (Prisma Studio, SQL, or future tooling) and re-run.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { searchTracks, type NormalizedTrack } from '../src/services/itunes'
import { seedTermRepository } from '../src/repositories/seedTermRepository'

const prisma = new PrismaClient()

interface FlavorBootstrap {
  id: string
  name: string
  description: string
  terms: string[]
}

const BOOTSTRAP_FLAVORS: FlavorBootstrap[] = [
  {
    id: 'rock',
    name: 'Rock',
    description: "Rockin' and rollin'",
    terms: [
      'Queen Bohemian Rhapsody',
      'Queen Don\'t Stop Me Now',
      'Led Zeppelin Stairway to Heaven',
      'Led Zeppelin Whole Lotta Love',
      'AC/DC Back in Black',
      'AC/DC Highway to Hell',
      'Aerosmith Dream On',
      'Aerosmith Walk This Way',
      'Bon Jovi Livin on a Prayer',
      'Bon Jovi Wanted Dead or Alive',
      'The Rolling Stones Satisfaction',
      'The Rolling Stones Paint It Black',
      'ZZ Top La Grange',
      'ZZ Top Sharp Dressed Man',
      'Guns N Roses Sweet Child O Mine',
      'Guns N Roses November Rain',
      'Nirvana Smells Like Teen Spirit',
      'Pearl Jam Alive',
      'Foo Fighters Everlong',
      'Metallica Enter Sandman',
      'Black Sabbath Iron Man',
      'Deep Purple Smoke on the Water',
      'The Who Baba O\'Riley',
      'The Doors Light My Fire',
      'Pink Floyd Comfortably Numb',
      'Pink Floyd Wish You Were Here',
      'Eagles Hotel California',
      'Lynyrd Skynyrd Sweet Home Alabama',
      'Boston More Than a Feeling',
      'Twisted Sister I Wanna Rock',
      'Steel Panther Eyes of a Panther',
      'The Beatles Come Together',
      'The Beatles Hey Jude',
      'The Beatles Let It Be',
      'David Bowie Heroes',
      'David Bowie Space Oddity',
      'Fleetwood Mac Dreams',
      'Fleetwood Mac Go Your Own Way',
      'U2 With or Without You',
      'U2 One',
      'Foo Fighters The Pretender',
      'Foo Fighters Best of You',
      'Green Day Basket Case',
      'Green Day American Idiot',
      'Linkin Park In the End',
      'Linkin Park Numb',
      'Red Hot Chili Peppers Californication',
      'Red Hot Chili Peppers Under the Bridge',
      'Soundgarden Black Hole Sun',
      'Alice in Chains Man in the Box',
      'Stone Temple Pilots Plush',
      'Rage Against the Machine Killing in the Name',
      'System of a Down Chop Suey',
      'Muse Uprising',
      'Muse Supermassive Black Hole',
      'Arctic Monkeys Do I Wanna Know',
      'The Killers Mr Brightside',
      'Kings of Leon Sex on Fire',
      'Coldplay Yellow',
      'Coldplay Fix You',
      'Radiohead Creep',
      'Oasis Wonderwall',
      'The Clash London Calling',
      'Ramones Blitzkrieg Bop',
    ],
  },
  {
    id: 'pop',
    name: 'Pop',
    description: 'Catchy hits that stick',
    terms: [
      'Michael Jackson Billie Jean',                                                                                                                                                    
      'Michael Jackson Thriller',                                                                                                                                                       
      'Michael Jackson Beat It',                                                                                                                                                        
      'Michael Jackson Smooth Criminal',                                                                                                                                                
      'Madonna Like a Prayer',
      'Madonna Material Girl',                                                                                                                                                          
      'Madonna Like a Virgin',                                                                                                                                                          
      'Whitney Houston I Wanna Dance with Somebody',
      'Whitney Houston I Will Always Love You',                                                                                                                                         
      'Cyndi Lauper Girls Just Want to Have Fun',                 
      'Tina Turner Whats Love Got to Do with It',                                                                                                                                       
      'George Michael Careless Whisper',                                                                                                                                                
      'Wham Last Christmas',                                                                                                                                                            
      'A-ha Take On Me',                                                                                                                                                                
      'Spice Girls Wannabe',                                      
      'Backstreet Boys I Want It That Way',                                                                                                                                             
      'NSYNC Bye Bye Bye',                                                                                                                                                              
      'Britney Spears Baby One More Time',
      'Britney Spears Toxic',                                                                                                                                                           
      'Britney Spears Oops I Did It Again',                                                                                                                                             
      'Christina Aguilera Genie in a Bottle',
      'Mariah Carey Always Be My Baby',                                                                                                                                                 
      'Celine Dion My Heart Will Go On',                          
      'Ricky Martin Livin La Vida Loca',                                                                                                                                                
      'Beyonce Crazy in Love',                                    
      'Beyonce Halo',                                                                                                                                                                   
      'Beyonce Single Ladies',                                                                                                                                                          
      'Rihanna Umbrella',
      'Rihanna Diamonds',                                                                                                                                                               
      'Rihanna We Found Love',                                    
      'Lady Gaga Bad Romance',                                                                                                                                                          
      'Lady Gaga Poker Face',                                                                                                                                                           
      'Lady Gaga Just Dance',
      'Katy Perry Roar',                                                                                                                                                                
      'Katy Perry Firework',                                                                                                                                                            
      'Katy Perry Teenage Dream',
      'Justin Timberlake Cry Me a River',                                                                                                                                               
      'Justin Timberlake SexyBack',                                                                                                                                                     
      'Pink So What',
      'Kelly Clarkson Since U Been Gone',                                                                                                                                               
      'Adele Rolling in the Deep',                                
      'Adele Hello',                                                                                                                                                                    
      'Adele Someone Like You',                                                                                                                                                         
      'Bruno Mars Uptown Funk',
      'Bruno Mars Just the Way You Are',                                                                                                                                                
      'Bruno Mars Grenade',                                                                                                                                                             
      'Taylor Swift Shake It Off',
      'Taylor Swift Blank Space',                                                                                                                                                       
      'Taylor Swift Bad Blood',                                                                                                                                                         
      'Justin Bieber Sorry',
      'Justin Bieber Love Yourself',                                                                                                                                                    
      'Justin Bieber Baby',                                                                                                                                                             
      'Ed Sheeran Shape of You',
      'Ed Sheeran Perfect',                                                                                                                                                             
      'Ed Sheeran Thinking Out Loud',                             
      'Ariana Grande Thank U Next',                                                                                                                                                     
      'Ariana Grande 7 Rings',                                                                                                                                                          
      'Ariana Grande Problem',                                                                                                                                                          
      'Sia Chandelier',                                                                                                                                                                 
      'Sia Cheap Thrills',                                                                                                                                                              
      'The Weeknd Blinding Lights',                               
      'The Weeknd Save Your Tears',                                                                                                                                                     
      'Dua Lipa Levitating',
      'Dua Lipa New Rules',                                                                                                                                                             
      'Dua Lipa Dont Start Now',                                  
      'Billie Eilish Bad Guy',                                                                                                                                                          
      'Billie Eilish Happier Than Ever',                                                                                                                                                
      'Olivia Rodrigo Drivers License',
      'Olivia Rodrigo Good 4 U',                                                                                                                                                        
      'Harry Styles Watermelon Sugar',                            
      'Harry Styles As It Was',                                                                                                                                                         
      'Doja Cat Say So',
      'Miley Cyrus Flowers',
      'Maroon 5 Memories',
      'Maroon 5 Sugar',
      'Maroon 5 Moves Like Jagger',
      'Coldplay Viva la Vida',
      'Coldplay The Scientist',
      'Shakira Hips Dont Lie',
      'Shakira Waka Waka',
      'Lana Del Rey Summertime Sadness',
      'Lana Del Rey Video Games',
      'Selena Gomez Lose You to Love Me',
      'Selena Gomez Same Old Love',
      'Demi Lovato Heart Attack',
      'Camila Cabello Havana',
      'Charlie Puth Attention',
      'Shawn Mendes Stitches',
      'Shawn Mendes Senorita',
      'Sam Smith Stay With Me',
      'Avicii Wake Me Up',
      'Avicii Levels',
      'Calvin Harris Summer',
      'Pink Try',
      'Pink Just Give Me a Reason',
      'Christina Aguilera Beautiful',
      'Jennifer Lopez On the Floor',
      'Gwen Stefani Hollaback Girl',
      'Black Eyed Peas I Gotta Feeling',
      'Black Eyed Peas Where Is the Love',
      'OneRepublic Counting Stars',
      'Imagine Dragons Believer',
    ],
  },
]

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replaceAll(/\(.*?\)|\[.*?\]/g, '')
    .replaceAll(/\s*-\s*(remaster(ed)?|live|radio edit|instrumental|deluxe|mono|stereo|version).*/gi, '')
    .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const songKeyOf = (artist: string, title: string): string =>
  `${normalize(artist)}::${normalize(title)}`

const loadExistingSongKeys = async (): Promise<Set<string>> => {
  const all = await prisma.track.findMany({ select: { artist: true, title: true } })
  return new Set(all.map((t) => songKeyOf(t.artist, t.title)))
}

const upsertTrack = (t: NormalizedTrack, flavorId: string) =>
  prisma.track.upsert({
    where: { itunesId: t.itunesId },
    update: {
      title: t.title,
      artist: t.artist,
      album: t.album,
      year: t.year,
      genre: t.genre,
      artworkUrl: t.artworkUrl,
      previewUrl: t.previewUrl,
      flavorId,
    },
    create: {
      itunesId: t.itunesId,
      title: t.title,
      artist: t.artist,
      album: t.album,
      year: t.year,
      genre: t.genre,
      artworkUrl: t.artworkUrl,
      previewUrl: t.previewUrl,
      flavorId,
    },
  })

const bootstrapIfEmpty = async (): Promise<void> => {
  const total = await seedTermRepository.count()
  if (total > 0) {
    console.log('[bootstrap] SeedTerm já populado, pulando.')
    return
  }

  for (const f of BOOTSTRAP_FLAVORS) {
    await prisma.flavor.upsert({
      where: { id: f.id },
      update: { name: f.name, description: f.description },
      create: { id: f.id, name: f.name, description: f.description },
    })

    const rows = f.terms.map((term) => ({ flavorId: f.id, term }))
    const inserted = await seedTermRepository.bulkInsert(rows)
    console.log(`[bootstrap] inseriu ${inserted} termos para ${f.id}`)
  }
}

const processFlavor = async (
  flavorId: string,
  existingSongKeys: Set<string>,
): Promise<void> => {
  const todo = await seedTermRepository.findPendingOrFailed(flavorId)
  if (todo.length === 0) {
    const counts = await seedTermRepository.countByStatus(flavorId)
    console.log(`[${flavorId}] nada a processar (success=${counts.success ?? 0})`)
    return
  }

  console.log(`[${flavorId}] processando ${todo.length} termos`)

  for (const seedTerm of todo) {
    try {
      const tracks = await searchTracks({ term: seedTerm.term, limit: 10 })
      let inserted = 0
      for (const t of tracks) {
        if (inserted >= 5) break
        const key = songKeyOf(t.artist, t.title)
        if (existingSongKeys.has(key)) continue
        await upsertTrack(t, flavorId)
        existingSongKeys.add(key)
        inserted += 1
      }
      await seedTermRepository.markSuccess(seedTerm.id, inserted)
      process.stdout.write(inserted === 0 ? '·' : '.')
    } catch (err) {
      const msg = (err as Error).message
      await seedTermRepository.markFailed(seedTerm.id, msg)
      process.stdout.write('x')
    }
    await sleep(300)
  }
  process.stdout.write('\n')

  const counts = await seedTermRepository.countByStatus(flavorId)
  const trackTotal = await prisma.track.count({ where: { flavorId } })
  console.log(
    `[${flavorId}] success=${counts.success ?? 0} failed=${counts.failed ?? 0} pending=${counts.pending ?? 0} | tracks no DB: ${trackTotal}`,
  )
}

const main = async (): Promise<void> => {
  await bootstrapIfEmpty()

  const existingSongKeys = await loadExistingSongKeys()
  console.log(`[seed] ${existingSongKeys.size} unique song keys já no DB`)

  const flavors = await prisma.flavor.findMany({ select: { id: true } })
  for (const { id } of flavors) {
    await processFlavor(id, existingSongKeys)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('\nDone.')
  })
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
