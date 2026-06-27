/**
 * agent/scripts/install-service.js
 *
 * Registers the enforcement agent as a Windows Service using node-windows.
 * The service will:
 *   - Auto-start on boot
 *   - Auto-restart on failure (3 attempts, 60s delay)
 *
 * Usage (run as Administrator):
 *   node scripts/install-service.js
 */

'use strict'

const path    = require('path')
const { Service } = require('node-windows')

const SCRIPT_PATH = path.resolve(__dirname, '..', 'src', 'index.js')

const svc = new Service({
  name:        'ParentalControlAgent',
  description: 'Parental Control — process enforcement engine and REST API',
  script:      SCRIPT_PATH,

  // Recovery: restart immediately on first 2 failures, 60 s on the third
  nodeOptions: [],
  wait:        2,          // seconds to wait between restart attempts
  grow:        0.5,        // multiplicative backoff factor
  maxRestarts: 10,         // give up after 10 restarts in < 24 h
  abortOnError: false,

  env: [
    { name: 'NODE_ENV', value: 'production' }
  ],
})

svc.on('install', () => {
  console.log('✅ Service installed successfully.')
  console.log('   Starting service...')
  svc.start()
})

svc.on('start', () => {
  console.log('✅ Service started.')
  console.log('   Service name : ParentalControlAgent')
  console.log('   Script       :', SCRIPT_PATH)
  console.log('')
  console.log('   Manage with:')
  console.log('     sc query ParentalControlAgent')
  console.log('     sc stop  ParentalControlAgent')
  console.log('     sc start ParentalControlAgent')
  process.exit(0)
})

svc.on('alreadyinstalled', () => {
  console.log('ℹ️  Service is already installed.')
  console.log('   Run uninstall-service.js first if you want to reinstall.')
  process.exit(0)
})

svc.on('error', (err) => {
  console.error('❌ Service error:', err)
  process.exit(1)
})

console.log('Installing Windows service "ParentalControlAgent"...')
svc.install()
