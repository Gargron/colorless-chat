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
]);

module.exports = Actions;
