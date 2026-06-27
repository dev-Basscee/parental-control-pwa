/**
 * agent/scripts/uninstall-service.js
 *
 * Removes the ParentalControlAgent Windows service.
 *
 * Usage (run as Administrator):
 *   node scripts/uninstall-service.js
 */

'use strict'

const path    = require('path')
const { Service } = require('node-windows')

const SCRIPT_PATH = path.resolve(__dirname, '..', 'src', 'index.js')

const svc = new Service({
  name:   'ParentalControlAgent',
  script: SCRIPT_PATH,
})

svc.on('uninstall', () => {
  console.log('✅ Service uninstalled successfully.')
  process.exit(0)
})

svc.on('notinstalled', () => {
  console.log('ℹ️  Service is not currently installed.')
  process.exit(0)
})

svc.on('error', (err) => {
  console.error('❌ Error:', err)
  process.exit(1)
})

console.log('Uninstalling Windows service "ParentalControlAgent"...')
svc.uninstall()
