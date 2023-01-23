import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { executablePath, Page } from 'puppeteer'
import { validate as uuidValidate } from 'uuid'
import fs from 'fs'
import path from 'path'

const userIds = ['hyunter#no1bm', 'buhbang#bbang']

puppeteer.use(StealthPlugin())

async function start() {
  const browser = await puppeteer.launch({ headless: true, executablePath: executablePath() })
  const page = await browser.newPage()
  const matches: string[] = []

  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i]

    const data = await fetchUser(page, userId)

    for (let j = 0; j < data.data.matches.length; j++) {
      const match = data.data.matches[j]
      const matchId = match.attributes.id
      const matchModeId = match.attributes.modeId

      if (matchModeId !== '/Game/GameModes/Bomb/BombGameMode.BombGameMode_C') {
        continue
      }

      if (!uuidValidate(matchId)) {
        continue
      }

      if (matches.includes(matchId)) {
        continue
      }

      matches.push(matchId)
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const matchId = matches[i]

    const data = await fetchMatch(page, matchId)

    saveMatch(data, `matches/${matchId}.json`)
  }

  await browser.close()

  console.log(matches)
}

async function fetchUser(page: Page, userId: string) {
  const response = await page.goto(
    `https://api.tracker.gg/api/v2/valorant/standard/matches/riot/${encodeURIComponent(userId)}?type=custom`
  )
  await page.waitForTimeout(2000)

  const data = await response?.json()

  return data
}

async function fetchMatch(page: Page, matchId: string) {
  const response = await page.goto(`https://api.tracker.gg/api/v2/valorant/standard/matches/${matchId}`)
  await page.waitForTimeout(2000)

  const data = await response?.json()

  return data
}

async function saveMatch(data: any, fileName: string) {
  const __dirname = path.resolve()

  const filePath = path.join(__dirname, fileName)

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

start()
