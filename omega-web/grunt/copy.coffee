module.exports =
  pac:
    files:
      'build/js/omega_pac.min.js': '../omega-pac/omega_pac.min.js'
  lib:
    expand: true
    cwd: 'lib'
    src: ['**/*']
    dest: 'build/lib/'
  bootstrap_fonts:
    expand: true
    cwd: 'node_modules/bootstrap/fonts'
    src: ['glyphicons-halflings-regular.*']
    dest: 'build/lib/bootstrap/fonts/'
  img:
    expand: true
    cwd: 'img'
    src: ['**/*']
    dest: 'build/img/'
  popup:
    expand: true
    cwd: 'src/popup'
    src: ['**/*']
    dest: 'build/popup/'
