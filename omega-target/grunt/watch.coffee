module.exports =
  grunt:
    options:
      reload: true
    files:
      'grunt/*'
    tasks: ['coffeelint:tasks', 'default']
  src:
    files: ['src/**/*.coffee', 'src/**/*.js', 'test/**/*.coffee']
    tasks: ['default']
