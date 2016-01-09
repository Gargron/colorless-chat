import ThemeManager from 'material-ui/lib/styles/theme-manager';
import DarkRawTheme from 'material-ui/lib/styles/raw-themes/dark-raw-theme';

let React = require('react');
let PureRenderMixin = require('react-addons-pure-render-mixin');
let ControlBar = require('./control_bar');
let MessagesList = require('./messages_list');
let StatusBar = require('./status_bar');
let Actions = require('../actions');
let mui = require('material-ui');
let Snackbar = mui.Snackbar;

const Main = React.createClass({

  mixins: [PureRenderMixin],

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

    this.unsubscribe3 = Actions.offline.listen(function () {
      this.setState({
        alertOpen: true,
        alertMessage: 'You have lost your internet connection',
      });
    }.bind(this));

    this.unsubscribe4 = Actions.connect.listen(function () {
      this.setState({
        alertOpen: true,
        alertMessage: 'Connected',
      });
    }.bind(this));

    this.unsubscribe5 = Actions.disconnect.listen(function () {
      this.setState({
        alertOpen: true,
        alertMessage: 'Disconnected',
      });
    }.bind(this));

    this.unsubscribe6 = Actions.warning.listen(function (d) {
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
    }.bind(this));
  },

  componentWillUnmount () {
    this.unsubscribe1();
    this.unsubscribe2();
    this.unsubscribe3();
    this.unsubscribe4();
    this.unsubscribe5();
    this.unsubscribe6();
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
