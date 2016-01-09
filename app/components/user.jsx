import ListItem from 'material-ui/lib/lists/list-item';
import Avatar from 'material-ui/lib/avatar';
import IconButton from 'material-ui/lib/icon-button';
import PublicIcon from 'material-ui/lib/svg-icons/social/public';
import IconMenu from 'material-ui/lib/menus/icon-menu';
import MenuItem from 'material-ui/lib/menus/menu-item';

let React = require('react');
let PureRenderMixin = require('react-addons-pure-render-mixin');
let ReactDOM = require('react-dom');
let Actions = require('../actions');

const User = React.createClass({

  mixins: [PureRenderMixin],

  handleClick () {
    Actions.mention(this.props.data.get('name'));
    this.props.onFinish();
  },

  handleProfileClick () {
    let node = ReactDOM.findDOMNode(this.refs.link);
    node.click();
  },

  render () {
    let name = this.props.data.get('name');
    let gravatar = '//gravatar.com/avatar/' + this.props.data.get('hash') + '?s=64';
    let hex = '#' + this.props.data.get('color');
    let role;
    let profile = this.props.baseUrl + '/users/' + name;

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

    let iconButtonElement = (
      <IconButton touch={true} tooltip="Open profile" tooltipPosition="bottom-left" onTouchTap={this.handleProfileClick}>
        <a ref='link' href={profile} target='_blank'></a>
        <PublicIcon color='#aaa' />
      </IconButton>
    );

    return <ListItem
      primaryText={name}
      secondaryText={<span style={{ color: '#999' }}>{role}</span>}
      secondaryTextLines={1}
      leftAvatar={<Avatar src={gravatar} />}
      onTouchTap={this.handleClick}
      rightIconButton={iconButtonElement} />;
  },

});

module.exports = User;
