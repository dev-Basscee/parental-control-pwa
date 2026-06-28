'use strict'

const path    = require('path')
const { Service } = require('node-windows')

const SCRIPT_PATH = path.resolve(__dirname, '..', '..', 'server.js')

const svc = new Service({
  name:        'ParentalControlServer',
  description: 'Parental Control — Proxy Server and Dashboard UI',
  script:      SCRIPT_PATH,
  nodeOptions: [],
  wait:        2,
  grow:        0.5,
  maxRestarts: 10,
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
  console.log('   Service name : ParentalControlServer')
  console.log('   Script       :', SCRIPT_PATH)
  process.exit(0)
})

svc.on('alreadyinstalled', () => {
  console.log('ℹ️  Service is already installed.')
  process.exit(0)
})

svc.on('error', (err) => {
  console.error('❌ Service error:', err)
  process.exit(1)
})

console.log('Installing Windows service "ParentalControlServer"...')
svc.install()
