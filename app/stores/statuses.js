let Reflux = require('reflux');
let Immutable = require('immutable');
let Actions = require('../actions');

const Statuses = Reflux.createStore({

  init () {
    this.listenTo(Actions.userJoined, this.onStatusChange);
    this.listenTo(Actions.userLeft, this.onStatusChange);
  },

  onStatusChange (d) {
    this.statuses = this.statuses.push(Immutable.fromJS(d));
    this.trigger(this.statuses);
  },

  getInitialState () {
    if (typeof this.statuses === 'undefined') {
      this.statuses = Immutable.List([]);
    }

    return this.statuses;
  },

});

module.exports = Statuses;
