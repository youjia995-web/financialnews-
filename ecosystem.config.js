module.exports = {
  apps: [
    {
      name: 'web',
      script: 'npm',
      args: 'start',
      env: {
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
