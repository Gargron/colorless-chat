let React = require('react');
let Actions = require('../actions');
let linkify = require('linkifyjs/string');

const Message = React.createClass({

  render () {
    let name = this.props.data.getIn(['user', 'name']);
    let gravatar = '//gravatar.com/avatar/' + this.props.data.getIn(['user', 'hash']) + '?s=64';
    let hex = '#' + this.props.data.get('hex');

    if (this.props.data.get('type') === 'message') {
      let body = linkify(this.props.data.get('text'));

      return (
        <div className='message message-text'>
          <div className='message__author'>
            <div className='message__author__avatar'>
              <img src={gravatar} width='50' height='50' alt={name} onClick={Actions.mention.bind(null, name)} />
            </div>

            <a href={this.props.baseUrl + '/users/' + name} target='_blank'>{name}</a>
          </div>

          <div className='message__triangle'><span style={{borderRightColor: hex }} /></div>
          <div className='message__text' style={{ backgroundColor: hex }} dangerouslySetInnerHTML={{ __html: body }}></div>
        </div>
      );
    } else {
      return (
        <div className='message message-action'>
          <span style={{ color: hex }}>&mdash; </span>
          <span className='message__author'>{name} </span>
          <span className='message__action'>{this.props.data.get('text')}</span>
        </div>
      );
    }
  },

});

module.exports = Message;
