let React = require('react');
let ControlBar = require('./control_bar');
let MessagesList = require('./messages_list');
let StatusBar = require('./status_bar');
let Actions = require('../actions');

const Main = React.createClass({

  getInitialState () {
    return {
      sound: true,
    };
  },

  componentDidMount () {
    this.unsubscribe1 = Actions.toggleSound.listen(function (sound) {
      this.setState({
        sound: sound,
      });
    }.bind(this));

    this.unsubscribe2 = Actions.mentionOccured.listen(function () {
      if (this.state.sound && typeof Audio !== 'undefined') {
        let audio = new Audio('/sounds/bling.mp3');
        audio.play();
      }
    }.bind(this));
  },

  componentWillUnmount () {
    this.unsubscribe1();
    this.unsubscribe2();
  },

  render () {
    return (
      <div className='main'>
        <ControlBar brand={this.props.brand} />
        <MessagesList />
        <StatusBar />
      </div>
    );
  },

});

module.exports = Main;
