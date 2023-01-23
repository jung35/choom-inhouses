import fs from 'fs-extra'
import path from 'path'
import { GoogleSpreadsheet } from 'google-spreadsheet'

async function start() {
  const jsonsInDir = fs.readdirSync('./matches').filter((file) => path.extname(file) === '.json')

  const users: any = {}

  jsonsInDir.forEach((file) => {
    const fileData = fs.readFileSync(path.join('./matches', file))
    const json = JSON.parse(fileData.toString())

    const segments = json.data.segments

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]

      switch (segment.type) {
        case 'player-summary':
          const userHandle = segment.metadata.platformInfo.platformUserHandle
          if (!users[userHandle]) {
            users[userHandle] = []
          }

          users[userHandle].push(segment)
          break
        default:
          break
      }
    }
  })

  const avgData = await generateTable(users, 'avg')
  await uploadGoogleSheet(avgData, 'avg')

  const totalData = await generateTable(users, 'total')
  await uploadGoogleSheet(totalData, 'total')
}

async function generateTable(users, type = 'avg') {
  const userHandles = Object.keys(users)

  if (type === 'avg') {
    return userHandles
      .map((handle) => ({
        handle,
        matches: users[handle].length.toString(),
        '.': '',
        ACS: avg(users[handle], 'scorePerRound').toFixed(1),
        'K/D': avg(users[handle], 'kdRatio').toFixed(1),
        Kills: avg(users[handle], 'kills').toFixed(0),
        Assists: avg(users[handle], 'assists').toFixed(0),
        Deaths: avg(users[handle], 'deaths').toFixed(0),
        'HS%': avg(users[handle], 'hsAccuracy').toFixed(1),
        ADR: avg(users[handle], 'damagePerRound').toFixed(1),
        ',': '',
        plants: avg(users[handle], 'plants').toFixed(1) || '-',
        defuses: avg(users[handle], 'defuses').toFixed(1) || '-',
        FK: avg(users[handle], 'firstKills').toFixed(1) || '-',
        FD: avg(users[handle], 'firstDeaths').toFixed(1) || '-',
        clutches: avg(users[handle], 'clutches').toFixed(1) || '-',
      }))
      .sort((a, b) => +b['acs'] - +a['acs'])
      .map((data, i) => ({ i: i + 1, ...data }))
  }

  if (type === 'total') {
    return userHandles
      .map((handle) => ({
        handle,
        matches: users[handle].length.toString(),
        '.': '',
        ACS: total(users[handle], 'score').toFixed(1),
        // 'K/D': total(users[handle], 'kdRatio').toFixed(1),
        Kills: total(users[handle], 'kills').toFixed(0),
        Assists: total(users[handle], 'assists').toFixed(0),
        Deaths: total(users[handle], 'deaths').toFixed(0),
        // 'HS%': total(users[handle], 'hsAccuracy').toFixed(1),
        DMG: total(users[handle], 'damage').toFixed(1),
        ',': '',
        plants: total(users[handle], 'plants').toFixed(1) || '-',
        defuses: total(users[handle], 'defuses').toFixed(1) || '-',
        FK: total(users[handle], 'firstKills').toFixed(1) || '-',
        FD: total(users[handle], 'firstDeaths').toFixed(1) || '-',
        clutches: total(users[handle], 'clutches').toFixed(1) || '-',
      }))
      .sort((a, b) => +b['ACS'] - +a['ACS'])
      .map((data, i) => ({ i: i + 1, ...data }))
  }
}
async function uploadGoogleSheet(data, sheetName) {
  const creds = JSON.parse(await fs.promises.readFile('./creds/tracker.json', 'utf-8'))
  const doc = new GoogleSpreadsheet('1haGWRPzvpw9tV8V2UBNuV5YNYatdFtLoXmciH7XKkrU')

  await doc.useServiceAccountAuth(creds)
  await doc.loadInfo() // loads document properties and worksheets

  const avgSheet = doc.sheetsByTitle[sheetName]
  await avgSheet.clearRows()
  await avgSheet.setHeaderRow(Object.keys(data[0]))
  await avgSheet.addRows(data)
}

function avg(user, target) {
  return user.map((match) => match.stats[target].value).reduce((a, b) => a + b, 0) / user.length
}

function total(user, target) {
  return user.map((match) => match.stats[target].value).reduce((a, b) => a + b, 0)
}

async function saveCompiledData(data: any, fileName: string) {
  const __dirname = path.resolve()

  const filePath = path.join(__dirname, fileName)

  fs.writeFileSync(filePath, data)
}

start()
