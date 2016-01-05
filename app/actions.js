let Reflux = require('reflux');

const Actions = Reflux.createActions([
  'messageReceived',
  'sendMessage',
  'userJoined',
  'userLeft',
  'usersLoaded',
  'authenticated',
  'switchChannel',
  'mentionOccured',
  'mention',
  'toggleSound',
  'connect',
  'disconnect',
  'offline',
]);

module.exports = Actions;
