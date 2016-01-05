let Reflux = require('reflux');
let Immutable = require('immutable');
let Actions = require('../actions');

const UsersStore = Reflux.createStore({

  init () {
    this.listenTo(Actions.usersLoaded, this.onUsersLoaded);
    this.listenTo(Actions.userJoined, this.onUserJoined);
    this.listenTo(Actions.userLeft, this.onUserLeft);
  },

  onUsersLoaded (d) {
    this.users = Immutable.Set(d.data.map(function (item) {
      return Immutable.fromJS(item);
    }));

    this.trigger(this.users);
  },

  onUserJoined (d) {
    if (this.users.find(function (item) {
      return item.get('id') === d.user.id;
    }, null, false)) {
      return;
    }

    this.users = this.users.add(Immutable.fromJS(d.user));
    this.trigger(this.users);
  },

  onUserLeft (d) {
    this.users = this.users.filterNot(function (item) {
      return item.get('id') === d.user.id;
    });

    this.trigger(this.users);
  },

  getInitialState () {
    if (typeof this.users === 'undefined') {
      this.users = Immutable.Set([]);
    }

    return this.users;
  },

});

module.exports = UsersStore;
