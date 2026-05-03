/**
 * Seeds the Postgres database with the initial Rock flavor and a curated
 * pool of tracks pulled from the iTunes Search API.
 *
 * Usage: `npm run seed` (idempotent — safe to re-run; uses upsert by itunesId).
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { searchTracks, type NormalizedTrack } from '../src/services/itunes'

const prisma = new PrismaClient()

interface FlavorSeed {
  id: string
  name: string
  description: string
  searchTerms: string[]
  /** Min number of unique tracks we want in the pool. */
  targetTracks: number
}

const FLAVORS: FlavorSeed[] = [
  {
    id: 'rock',
    name: 'Rock',
    description: "Rockin' and rollin'",
    targetTracks: 60,
    searchTerms: [
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
    targetTracks: 60,                                                                                                                                                                   
    searchTerms: [
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

const dedupeByItunesId = (tracks: NormalizedTrack[]): NormalizedTrack[] => {
  const seen = new Set<string>()
  const out: NormalizedTrack[] = []
  for (const t of tracks) {
    if (seen.has(t.itunesId)) continue
    seen.add(t.itunesId)
    out.push(t)
  }
  return out
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const seedFlavor = async (flavor: FlavorSeed): Promise<void> => {
  console.log(`\n[flavor:${flavor.id}] upserting flavor row`)
  await prisma.flavor.upsert({
    where: { id: flavor.id },
    update: { name: flavor.name, description: flavor.description },
    create: { id: flavor.id, name: flavor.name, description: flavor.description },
  })

  const collected: NormalizedTrack[] = []
  for (const term of flavor.searchTerms) {
    try {
      const tracks = await searchTracks({ term, limit: 10 })
      for (let i = 0; i < Math.min(tracks.length, 5); i++) {
        collected.push(tracks[i])
      }
      process.stdout.write('.')
    } catch (err) {
      console.warn(`\n[flavor:${flavor.id}] search "${term}" failed:`, (err as Error).message)
    }
    await sleep(300)
  }
  process.stdout.write('\n')

  const unique = dedupeByItunesId(collected)
  console.log(`[flavor:${flavor.id}] fetched ${collected.length} tracks (${unique.length} unique)`)

  let upserted = 0
  for (const t of unique) {
    await prisma.track.upsert({
      where: { itunesId: t.itunesId },
      update: {
        title: t.title,
        artist: t.artist,
        album: t.album,
        year: t.year,
        genre: t.genre,
        artworkUrl: t.artworkUrl,
        previewUrl: t.previewUrl,
        flavorId: flavor.id,
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
        flavorId: flavor.id,
      },
    })
    upserted += 1
  }

  const total = await prisma.track.count({ where: { flavorId: flavor.id } })
  console.log(`[flavor:${flavor.id}] upserted ${upserted}; total in DB: ${total}`)
  if (total < flavor.targetTracks) {
    console.warn(
      `[flavor:${flavor.id}] WARNING: pool is ${total}, target was ${flavor.targetTracks}. ` +
        `Extend FLAVORS[].searchTerms to grow the pool.`,
    )
  }
}

const main = async (): Promise<void> => {
  for (const flavor of FLAVORS) {
    await seedFlavor(flavor)
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
