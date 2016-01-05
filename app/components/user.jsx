let React = require('react');
let Actions = require('../actions');

const User = React.createClass({

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
    }

    return (
      <div className='user'>
        <div className='user__avatar'><img src={gravatar} width='35' height='35' alt={name} onClick={Actions.mention.bind(null, name)} /></div>
        <span className='user__name'>{name}</span>
        <span className='user__role'>{role}</span>
      </div>
    );
  },

});

module.exports = User;
