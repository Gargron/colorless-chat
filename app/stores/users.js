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

  findBestCompletion (str) {
    let matches = this.users.filter(function (user) {
      return user.get('name').indexOf(str) === 0;
    });

    if (matches.size === 1) {
      let full = matches.first().get('name');
      return full.slice(str.length);
    }

    if (matches.size > 1) {
      let sorted = matches.sort(function (a, b) {
        let str1 = a.get('name');
        let str2 = b.get('name');

        return ((str1 === str2) ? 0 : ((str1 > str2) ? 1 : -1));
      });

      let shortest = sorted.first().get('name');
      let others   = sorted.rest().toArray();
      let best     = '';

      for (let i = 0; i < shortest.length; i += 1) {
        let terminate = false;

        for (let k = 0; k < others.length; k += 1) {
          if (shortest.charAt(i) !== others[k].get('name').charAt(i)) {
            terminate = true;
            break;
          }
        }

        if (terminate) {
          break;
        }

        best += shortest.charAt(i);
      }

      return best.slice(str.length);
    }

    return '';
  },

  getInitialState () {
    if (typeof this.users === 'undefined') {
      this.users = Immutable.Set([]);
    }

    return this.users;
  },

});

module.exports = UsersStore;
