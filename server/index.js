
import http from 'http'
import app from './web3server.js'


const server = http.createServer(app)
let currentApp = app
server.listen(5000)

// if (module.hot) {
//     debugger;

//  module.hot.accept('./server', () => {
//   server.removeListener('request', currentApp)
//   server.on('request', app)
//   currentApp = app
//  })
// }
