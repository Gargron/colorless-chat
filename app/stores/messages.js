let Reflux = require('reflux');
let Immutable = require('immutable');
let Actions = require('../actions');

const MessagesStore = Reflux.createStore({

  init () {
    this.listenTo(Actions.messageReceived, this.onMessageReceived);
    this.listenTo(Actions.authenticated, this.onAuthenticated);
  },

  onAuthenticated (d) {
    this.self = d.user;
  },

  onMessageReceived (d) {
    this.messages = this.messages.push(Immutable.fromJS(d));
    this.trigger(this.messages);

    if (d.text.search(new RegExp(this.self.name, "i")) !== -1) {
      Actions.mentionOccured();
    }
  },

  getInitialState () {
    if (typeof this.messages === 'undefined') {
      this.messages = Immutable.List([]);
    }

    return this.messages;
  },

});

module.exports = MessagesStore;
