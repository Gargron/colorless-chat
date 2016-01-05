let React = require('react');
let Reflux = require('reflux');
let messagesStore = require('../stores/messages');
let Message = require('./message');

const MessagesList = React.createClass({

  mixins: [Reflux.connect(messagesStore, "messages")],

  render () {
    let items = this.state.messages.reverse().map(function (item) {
      return <Message key={item.get('id')} data={item} />;
    });

    return (
      <div className='messages-list'>
        <div className='container'>
          {items}
        </div>
      </div>
    );
  },

});

module.exports = MessagesList;
