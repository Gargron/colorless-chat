import injectTapEventPlugin from 'react-tap-event-plugin';

console.log('Welcome to colorless-chat version ' + window.env['VERSION']);
console.log(`






         MMMMMM
        M MMMMMMMMM
                MMMMMMMMM M    M
           MM. MM.     MM      . .
              MMMM M MMM       .M.M.
                    M.M        . MMMM
                   MM .       M M  MMMMMM
                     M M             .MMMMMMM
                    M.            MM  M  MMMMMMMM
                    M M             MMM M    MMM.
                                      .MMM.     M
                   MM                     MM
                  MMM
                 MMMM   ...
                     M MM.
                     .  MMM

             MM . M
              MM      MM
                    M.   .
                        M M
              M
               MMM
               MMMMMM.

                                              ..


                                                            `);

let React    = require('react');
let ReactDOM = require('react-dom');
let Actions  = require('./actions');
let Main     = require('./components/main');
let usersStore = require('./stores/users');

// Initialize listeners
usersStore.getInitialState();

let socket = io();

socket.on('message', function (d) {
  let raw = JSON.parse(d);

  switch(raw.type) {
    case 'sync':
      Actions.usersLoaded(raw);
      break;
    case 'auth':
      Actions.authenticated(raw);
      break;
    case 'join':
      Actions.userJoined(raw);
      break;
    case 'leave':
      Actions.userLeft(raw);
      break;
    default:
      Actions.messageReceived(raw);
  }
});

socket.on('disconnect', function () {
  Actions.disconnect();
});

socket.on('connect', function () {
  Actions.connect();
});

socket.on('warning', function (d) {
  Actions.warning(JSON.parse(d));
});

window.addEventListener('offline', function () {
  if (!navigator.onLine) {
    Actions.offline();
  }
});

Actions.sendMessage.listen(function (t, hex) {
  socket.emit('message', { text: t, hex: hex });
});

Actions.switchChannel.listen(function (channel) {
  socket.emit('resubscribe', channel);
});

injectTapEventPlugin();

let channels = window.env['CHANNELS'].split(';').map(function (item) {
  return item.split(':');
});

ReactDOM.render(<Main brand={window.env['BRAND']} baseUrl={window.env['BASE_URL']} channels={channels} />, document.getElementById('app'));

window.React = React;
