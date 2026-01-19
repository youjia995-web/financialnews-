module.exports = {
  apps: [
    {
      name: 'web',
      script: 'npm',
      args: 'start',
      env: {
        PORT: '6081',
        HOSTNAME: '0.0.0.0'
      }
    },
    {
      name: 'fetcher',
      script: 'npm',
      args: 'run fetcher'
    }
  ]
}
