let React = require('react');
let PureRenderMixin = require('react-addons-pure-render-mixin');
let Reflux = require('reflux');
let ReactDOM = require('react-dom');
let Actions = require('../actions');
let Dropdown = require('./dropdown');
let usersStore = require('../stores/users');

const ControlBar = React.createClass({

  mixins: [
    PureRenderMixin,
    Reflux.listenTo(Actions.mention, 'onMention'),
    Reflux.listenTo(Actions.connect, 'onConnect'),
    Reflux.listenTo(Actions.disconnect, 'onDisconnect'),
  ],

  getInitialState () {
    return {
      text: '',
      color: null,
      channel: 'default',
      online: true,
    };
  },

  onConnect () {
    this.setState({
      channel: 'default',
      online: true,
    });
  },

  onDisconnect () {
    this.setState({
      online: false,
    });
  },

  onMention (name) {
    this.setState({
      text: this.state.text + name + ' ',
    });

    ReactDOM.findDOMNode(this.refs.input).focus();
  },

  handleTextChange (e) {
    this.setState({
      text: e.target.value,
    });
  },

  handleInputHelp (e) {
    if (e.keyCode === 13) {
      return this.handleSubmit(e);
    }
  },

  handleCompletions (e) {
    if (e.keyCode === 9) {
      e.preventDefault();

      let node = ReactDOM.findDOMNode(this.refs.input);
      let caretPosition = node.selectionStart;
      let str = this.state.text;
      let word;

      let left = str.slice(0, caretPosition).search(/\S+$/);
      let right = str.slice(caretPosition).search(/\s/);

      if (right < 0) {
        word = str.slice(left);
      } else {
        word = str.slice(left, right + caretPosition);
      }

      if (word.replace(/\s+/, '').length > 0) {
        let match = usersStore.findBestCompletion(word);

        this.setState({
          text: [str.slice(0, caretPosition), match, str.slice(caretPosition)].join(''),
        });
      }
    }
  },

  handleSubmit (e) {
    if (!this.state.online) {
      return;
    }

    Actions.sendMessage(this.state.text, this.state.color);

    this.setState({
      text: '',
    });
  },

  handleChannelChange (channel) {
    Actions.switchChannel(channel);

    this.setState({
      channel: channel,
    });
  },

  handleColorChange (color) {
    this.setState({
      color: color,
    });
  },

  handleSoundChange (sound) {
    Actions.toggleSound(sound);
  },

  render () {
    let channels = this.props.channels.map(function (item) {
      return {
        label: item[0],
        value: item[1],
      };
    });

    let colors = [
      { label: 'Custom', value: null },
      { label: "Black", value:      "222223" },
      { label: "Orange", value:     "d68f19" },
      { label: "Blue", value:       "5d9dc2" },
      { label: "Dark blue", value:  "3c629b" },
      { label: "Red", value:        "920003" },
      { label: "Magenta", value:    "95005c" },
      { label: "Green", value:      "1d8140" },
      { label: "Grey", value:       "717171" },
      { label: "Mud Green", value:  "777137" },
      { label: "Purple", value:     "3c1773" },
      { label: "Lime green", value: "5ab800" },
    ];

    return (
      <div className='control-bar'>
        <div className='container'>
          <div className='pull-right'>
            <a href={this.props.baseUrl} target='_blank' className='brand'>{this.props.brand}</a>
          </div>

          <Dropdown label='Channel' options={channels} onChange={this.handleChannelChange} preselected={this.state.channel} />
          <Dropdown label='Color' options={colors} onChange={this.handleColorChange} preselected={this.state.color} />
          <Dropdown label='Sound' options={[{ label: 'On', value: true}, { label: 'Off', value: false }]} onChange={this.handleSoundChange} />

          <div className='control-bar__form'>
            <input ref='input' className='input-control' type='text' autoFocus autoComplete='off' value={this.state.text} onChange={this.handleTextChange} onKeyUp={this.handleInputHelp} onKeyDown={this.handleCompletions} />
            <button className='btn' onClick={this.handleSubmit} disabled={!this.state.online}>Post!</button>
          </div>
        </div>
      </div>
    );
  },

});

module.exports = ControlBar;
