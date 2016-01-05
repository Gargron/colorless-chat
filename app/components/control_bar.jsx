let React = require('react');
let Actions = require('../actions');
let Dropdown = require('./dropdown');

const ControlBar = React.createClass({

  getInitialState () {
    return {
      text: '',
      color: null,
    };
  },

  componentDidMount () {
    this.unsubscribe = Actions.mention.listen(function (name) {
      this.setState({
        text: this.state.text + '@' + name + ' ',
      });

      React.findDOMNode(this.refs.input).focus();
    }.bind(this));
  },

  componentWillUnmount () {
    this.unsubscribe();
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

  handleSubmit (e) {
    Actions.sendMessage(this.state.text, this.state.color);

    this.setState({
      text: '',
    });
  },

  handleChannelChange (channel) {
    Actions.switchChannel(channel);
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
    let channels = [
      { label: '/main/', value: 'default' },
      { label: '/ru/', value: 'russian' },
    ];

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
            <a href='#' target='_blank' className='brand'>{this.props.brand}</a>
          </div>

          <Dropdown label='Channel' options={channels} onChange={this.handleChannelChange} />
          <Dropdown label='Color' options={colors} onChange={this.handleColorChange} />
          <Dropdown label='Sound' options={[{ label: 'On', value: true}, { label: 'Off', value: false }]} onChange={this.handleSoundChange} />

          <div className='control-bar__form'>
            <input ref='input' className='input-control' type='text' autoFocus autoComplete='off' value={this.state.text} onChange={this.handleTextChange} onKeyUp={this.handleInputHelp} />
            <button className='btn' onClick={this.handleSubmit}>Post!</button>
          </div>
        </div>
      </div>
    );
  },

});

module.exports = ControlBar;
