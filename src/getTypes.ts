import fs from 'fs'
import path from 'path'

async function start() {
  const jsonsInDir = fs.readdirSync('./matches').filter((file) => path.extname(file) === '.json')

  const file = jsonsInDir[0]
  console.log('file', file)

  // jsonsInDir.forEach((file) => {
  const fileData = fs.readFileSync(path.join('./matches', file))
  const json = JSON.parse(fileData.toString())

  const segments = json.data.segments

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    console.log('type:', segment.type)
    // switch (segment.type) {
    //   case 'player-summary':
    //     const userHandle = segment.metadata.platformInfo.platformUserHandle
    //     if (!users[userHandle]) {
    //       users[userHandle] = []
    //     }

    //     users[userHandle].push(segment)
    //     break
    //   default:
    //     break
    // }
  }
  // })
}

start()
