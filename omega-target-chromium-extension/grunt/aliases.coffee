module.exports =
  default: [
    'coffeelint'
    'browserify'
    'copy'
    'po2crx'
  ]
  test: ['mochaTest']
  release: ['default', 'chromium-manifest', 'compress']
