const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function getInstalledApps() {
  try {
    // PowerShell command to fetch installed apps from the 64-bit and 32-bit registry, 
    // and modern Windows Store apps (AppxPackages)
    const psCommand = `
      $apps = @()
      $apps += Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* -ErrorAction SilentlyContinue | Select-Object DisplayName, DisplayVersion, InstallLocation
      $apps += Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* -ErrorAction SilentlyContinue | Select-Object DisplayName, DisplayVersion, InstallLocation
      $apps += Get-ItemProperty HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* -ErrorAction SilentlyContinue | Select-Object DisplayName, DisplayVersion, InstallLocation
      
      $apps | Where-Object { $_.DisplayName -and $_.DisplayName -notmatch "Update|Redistributable|Security" } | 
              Sort-Object DisplayName -Unique | 
              ConvertTo-Json -Compress
    `;

    const { stdout } = await execAsync(`powershell -NoProfile -Command "${psCommand}"`, { windowsHide: true });
    
    if (!stdout) return [];
    const apps = JSON.parse(stdout);
    
    // Clean up the data to send to the frontend
    return apps.map(app => ({
      name: app.DisplayName,
      version: app.DisplayVersion || 'Unknown',
      path: app.InstallLocation || null
    }));

  } catch (error) {
    console.error('[scanner] Error fetching installed apps:', error.message);
    return [];
  }
}

module.exports = { getInstalledApps };
