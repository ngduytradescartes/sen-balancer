import configs from 'app/configs'

const {
  manifest: { url, appId },
} = configs

const register: SenHubRegister = {
  [appId]: {
    url: `${url}/index.js`,
    appId,
    name: 'My App',
    author: {
      name: '',
      email: ''
    },
    description: ''
  },
  bulksender: {
    url: 'https://descartesnetwork.github.io/bulksender/index.js',
    appId: 'bulksender',
    name: 'Bulk Sender',
    author: {
      name: 'Tu Phan',
      email: 'tuphan@descartes.network'
    },
    description: 'Single sign, multiple transactions'
  },
}

export default register
