let React = require('react');
let PureRenderMixin = require('react-addons-pure-render-mixin');
let Reflux = require('reflux');
let Actions = require('../actions');
let UsersList = require('./users_list');
let statusesStore = require('../stores/statuses');

const StatusBar = React.createClass({

  mixins: [PureRenderMixin, Reflux.connect(statusesStore, "statuses")],

  render () {
    let last = this.state.statuses.last();
    let lastStatus;

    if (typeof last === 'undefined') {
      lastStatus = (<div className='status-bar__last' />);
    } else {
      lastStatus = (<div className='status-bar__last'>{last.getIn(['user', 'name'])} {last.get('type') === 'join' ? 'is now online' : 'is now offline'}</div>);
    }

    return (
      <div className='status-bar'>
        {lastStatus}
        <UsersList baseUrl={this.props.baseUrl} />
      </div>
    );
  },

});

module.exports = StatusBar;
