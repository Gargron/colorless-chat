(function () {
  let React    = require('react');
  let ReactDOM = require('react-dom');
  let Actions  = require('./actions');
  let Main     = require('./components/main');
  let usersStore = require('./stores/users');

  // Initialize listeners
  usersStore.getInitialState();

  let socket = io();

  socket.on('message', function (d) {
    console.log(d);

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

  Actions.sendMessage.listen(function (t, hex) {
    socket.emit('message', { text: t, hex: hex });
  });

  Actions.switchChannel.listen(function (channel) {
    socket.emit('resubscribe', channel);
  });

  ReactDOM.render(<Main brand={window.BRAND} />, document.getElementById('app'));

  window.React = React;
})();
