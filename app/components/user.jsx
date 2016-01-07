import ListItem from 'material-ui/lib/lists/list-item';
import Avatar from 'material-ui/lib/avatar';

let React = require('react');
let Actions = require('../actions');

const User = React.createClass({

  handleClick (e) {
    Actions.mention(this.props.data.get('name'));
    this.props.onFinish();
  },

  render () {
    let name = this.props.data.get('name');
    let gravatar = '//gravatar.com/avatar/' + this.props.data.get('hash') + '?s=64';
    let hex = '#' + this.props.data.get('color');
    let role;

    switch (this.props.data.get('role')) {
      case 0:
        role = 'Banned';
        break;
      case 1:
        role = 'Regular member';
        break;
      case 2:
        role = 'Ranger';
        break;
      case 3:
        role = 'Moderator';
        break;
      case 4:
        role = 'Admin';
        break;
      case 5:
        role = 'Owner';
        break;
    }

    return <ListItem
      primaryText={name}
      secondaryText={<span style={{ color: '#999' }}>{role}</span>}
      secondaryTextLines={1}
      leftAvatar={<Avatar src={gravatar} />}
      onTouchTap={this.handleClick} />;
  },

});

module.exports = User;
