import dirTree from 'directory-tree'
const directory = process.argv.slice(2)[0]

const lostPath = 'C:\\Users\\Zane\\Downloads\\Lost The Complete Series Season 1,2,3,4,5,6 + English Subs'
const tree = (dirTree as any)(directory || lostPath)

for (const folder of tree.children) {
  const seasons: ISeason[] = []
  if (/Season/.test(folder.name)) {
    seasons.push(parseSeason(folder))
  }
  console.log(seasons)

}

interface ISeason {
  no: number,
  episodes: IEpisode[]
}

interface IEpisode {
  no: number,
  name: string,
  path: string
}

function parseSeason(tree): ISeason {
  const findSeasonNumberRegex = /\d+/g
  const seasonNo = parseInt(tree.name.match(findSeasonNumberRegex))
  const episodes: IEpisode[] = []
  for (const folder of tree.children) {
    const episode = parseEpisode(folder)
    if (!episode) continue
    episodes.push(episode)
    console.log(episode)
  }
  return {
    no: seasonNo,
    episodes
  }

}

function parseEpisode(tree):IEpisode | undefined {
  try {
    const episodeNo = parseInt(tree.name.match(/e\d\d/g)[0].match(/\d\d/)[0])
    return {
      name: tree.name,
      path: tree.path,
      no: episodeNo
    }
  } catch(e) {
    console.log(`Couldn't parse ${tree.name}`)
  }

}

function convertInPlace() {

}