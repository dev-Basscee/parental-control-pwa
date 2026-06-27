import express from 'express'
import cors from 'cors'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)
const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

interface InstalledApp {
  displayName: string
  processName: string
  icon?: string
  path?: string
}

// Get installed Windows apps
app.get('/api/installed-apps', async (req, res) => {
  try {
    const apps = await getInstalledApps()
    res.json(apps)
  } catch (error) {
    console.error('Error fetching installed apps:', error)
    // Return mock data if there's an error
    res.json(getMockApps())
  }
})

// Get a single app by process name
app.get('/api/app/:processName', async (req, res) => {
  try {
    const { processName } = req.params
    const apps = await getInstalledApps()
    const app = apps.find(
      (a) => a.processName.toLowerCase() === processName.toLowerCase()
    )

    if (app) {
      res.json(app)
    } else {
      res.status(404).json({ error: 'App not found' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch app' })
  }
})

// Get all processes currently running
app.get('/api/running-processes', async (req, res) => {
  try {
    const processes = await getRunningProcesses()
    res.json(processes)
  } catch (error) {
    console.error('Error fetching running processes:', error)
    res.json([])
  }
})

async function getInstalledApps(): Promise<InstalledApp[]> {
  try {
    // Try to get apps from Windows registry
    const apps: InstalledApp[] = []

    // Method 1: Check Program Files directories
    const programFilesPath = process.env.ProgramFiles || 'C:\\Program Files'
    const programFilesX86 =
      process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'

    const dirs = [programFilesPath, programFilesX86]

    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        try {
          const entries = fs.readdirSync(dir)
          for (const entry of entries.slice(0, 50)) {
            // Limit to first 50 to avoid slowdown
            const fullPath = path.join(dir, entry)
            const stat = fs.statSync(fullPath)

            if (stat.isDirectory() && !entry.startsWith('.')) {
              // Look for executables
              try {
                const exePath = path.join(fullPath, `${entry}.exe`)
                if (fs.existsSync(exePath)) {
                  apps.push({
                    displayName: entry,
                    processName: `${entry}.exe`,
                    path: exePath,
                  })
                }
              } catch {}
            }
          }
        } catch {}
      }
    }

    // If we found some apps, return them. Otherwise return mock data
    if (apps.length > 0) {
      return apps.sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      )
    }

    return getMockApps()
  } catch (error) {
    console.error('Error in getInstalledApps:', error)
    return getMockApps()
  }
}

async function getRunningProcesses(): Promise<{ name: string; pid: number }[]> {
  try {
    const { stdout } = await execAsync(
      'tasklist /FO CSV /NH',
      { encoding: 'utf-8' }
    )

    const lines = stdout.split('\n').filter((line) => line.trim())
    const processes = lines.map((line) => {
      const parts = line.split(',')
      return {
        name: parts[0]?.replace(/"/g, ''),
        pid: parseInt(parts[1]?.replace(/"/g, '') || '0'),
      }
    })

    return processes.filter((p) => p.name && !isNaN(p.pid))
  } catch (error) {
    console.error('Error fetching running processes:', error)
    return []
  }
}

function getMockApps(): InstalledApp[] {
  return [
    { displayName: 'Google Chrome', processName: 'chrome.exe' },
    { displayName: 'Mozilla Firefox', processName: 'firefox.exe' },
    { displayName: 'Microsoft Edge', processName: 'msedge.exe' },
    { displayName: 'Discord', processName: 'Discord.exe' },
    { displayName: 'Spotify', processName: 'Spotify.exe' },
    { displayName: 'Steam', processName: 'steam.exe' },
    { displayName: 'Epic Games Launcher', processName: 'EpicGamesLauncher.exe' },
    { displayName: 'Visual Studio Code', processName: 'Code.exe' },
    { displayName: 'Notepad++', processName: 'notepad++.exe' },
    { displayName: 'VLC Media Player', processName: 'vlc.exe' },
    { displayName: 'OBS Studio', processName: 'obs64.exe' },
    { displayName: 'Blender', processName: 'blender.exe' },
    { displayName: 'Adobe Photoshop', processName: 'Photoshop.exe' },
    { displayName: 'Slack', processName: 'Slack.exe' },
    { displayName: 'Telegram', processName: 'Telegram.exe' },
    { displayName: 'WhatsApp', processName: 'WhatsApp.exe' },
    { displayName: 'YouTube Music', processName: 'YouTubeMusic.exe' },
    { displayName: 'Twitch', processName: 'Twitch.exe' },
    { displayName: 'Roblox', processName: 'RobloxPlayerBeta.exe' },
    { displayName: 'Minecraft Launcher', processName: 'javaw.exe' },
    { displayName: 'Java', processName: 'java.exe' },
    { displayName: 'Python', processName: 'python.exe' },
    { displayName: 'Node.js', processName: 'node.exe' },
    { displayName: 'Git Bash', processName: 'bash.exe' },
    { displayName: 'PowerShell', processName: 'pwsh.exe' },
  ].sort((a, b) => a.displayName.localeCompare(b.displayName))
}

app.listen(PORT, () => {
  console.log(`[Parental Control Backend] Server running on port ${PORT}`)
  console.log(`API endpoint: http://localhost:${PORT}/api/installed-apps`)
})
