import ThemeManager from 'material-ui/lib/styles/theme-manager';
import DarkRawTheme from 'material-ui/lib/styles/raw-themes/dark-raw-theme';

let React = require('react');
let PureRenderMixin = require('react-addons-pure-render-mixin');
let Reflux = require('reflux');
let ControlBar = require('./control_bar');
let MessagesList = require('./messages_list');
let StatusBar = require('./status_bar');
let Actions = require('../actions');
let mui = require('material-ui');
let Snackbar = mui.Snackbar;

const Main = React.createClass({

  mixins: [
    PureRenderMixin,
    Reflux.listenTo(Actions.toggleSound, 'onToggleSound'),
    Reflux.listenTo(Actions.mentionOccured, 'onMentionOccurred'),
    Reflux.listenTo(Actions.offline, 'onOffline'),
    Reflux.listenTo(Actions.connect, 'onConnect'),
    Reflux.listenTo(Actions.disconnect, 'onDisconnect'),
    Reflux.listenTo(Actions.warning, 'onWarning'),
  ],

  childContextTypes : {
    muiTheme: React.PropTypes.object,
  },

  getChildContext() {
    return {
      muiTheme: ThemeManager.getMuiTheme(DarkRawTheme),
    };
  },

  getInitialState () {
    return {
      sound: true,
      alertOpen: false,
      alertMessage: '',
    };
  },

  onToggleSound (sound){
    this.setState({
      sound: sound,
    });
  },

  onMentionOccurred () {
    if (this.state.sound && typeof Audio !== 'undefined') {
      let audio = new Audio();

      if (!!audio.canPlayType('audio/mpeg;').replace(/^no$/, '')) {
        audio = new Audio('/sounds/bling.mp3');
        audio.play();
      } else if (!!audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '')) {
        audio = new Audio('/sounds/bling.ogg');
        audio.play();
      }
    }
  },

  onOffline () {
    this.setState({
      alertOpen: true,
      alertMessage: 'You have lost your internet connection',
    });
  },

  onDisconnect () {
    this.setState({
      alertOpen: true,
      alertMessage: 'Disconnected',
    });
  },

  onConnect () {
    this.setState({
      alertOpen: true,
      alertMessage: 'Connected',
    });
  },

  onWarning (d) {
    let msg;

    switch(d.type) {
      case 'banned':
        msg = 'You are banned and cannot post';
        break;
      case 'muted':
        msg = 'You are currently muted';
        break;
      case 'bad-args':
        msg = 'Your command was not processed due to invalid arguments';
        break;
      default:
        msg = 'Unknown error prevented your message from being broadcast';
    }

    this.setState({
      alertOpen: true,
      alertMessage: msg,
    });
  },

  handleRequestClose () {
    this.setState({
      alertOpen: false,
    });
  },

  render () {
    return (
      <div className='main'>
        <ControlBar brand={this.props.brand} baseUrl={this.props.baseUrl} channels={this.props.channels} />
        <MessagesList baseUrl={this.props.baseUrl} />
        <StatusBar baseUrl={this.props.baseUrl} />
        <Snackbar open={this.state.alertOpen} message={this.state.alertMessage} onRequestClose={this.handleRequestClose} />
      </div>
    );
  },

});

module.exports = Main;
