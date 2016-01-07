import List from 'material-ui/lib/lists/list';

let React = require('react');
let Reflux = require('reflux');
let mui = require('material-ui');
let LeftNav = mui.LeftNav;
let usersStore = require('../stores/users');
let User = require('./user');

const UsersList = React.createClass({

  mixins: [Reflux.connect(usersStore, "users")],

  getInitialState () {
    return {
      open: false,
    };
  },

  handleToggle (e) {
    e.preventDefault();

    this.setState({
      open: !this.state.open,
    });
  },

  handleChange (open) {
    this.setState({
      open: open,
    });
  },

  render () {
    let count = this.state.users.size;

    let items = this.state.users.map(function (item) {
      return <User key={item.get('id')} data={item} onFinish={this.handleChange.bind(null, false)}/>;
    }, this);

    return (
      <div className='users-list'>
        <div className='users-list__online'><span className='users-list__label'>Online</span>: {count}</div>

        <a href='#' onClick={this.handleToggle}>See who is online</a>

        <LeftNav className='users-list__overlay' width={400} openRight={true} docked={false} open={this.state.open} onRequestChange={this.handleChange} style={{ backgroundColor: '#222223', overflowY: 'scroll' }}>
          <List className='users-list__list'>
            {items}
          </List>
        </LeftNav>
      </div>
    );
  },

});

module.exports = UsersList;
