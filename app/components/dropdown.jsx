import ClickAwayable from 'material-ui/lib/mixins/click-awayable';

let React = require('react');
let PureRenderMixin = require('react-addons-pure-render-mixin');

const Dropdown = React.createClass({

  mixins: [PureRenderMixin, ClickAwayable],

  getInitialState () {
    return {
      selected: null,
      open: false,
    };
  },

  handleToggle (e) {
    e.preventDefault();

    this.setState({
      open: !this.state.open,
    });
  },

  handleSelect (option, e) {
    e.preventDefault();

    this.setState({
      selected: option,
      open: false,
    });

    this.props.onChange(option.value);
  },

  componentClickAway () {
    this.setState({
      open: false,
    });
  },

  render () {
    let options = this.props.options.map(function (option) {
      return (<li key={option.value}><a href='#' onClick={this.handleSelect.bind(this, option)}>{option.label}</a></li>);
    }, this);

    let selected;

    if (this.props.preselected) {
      selected = this.props.options.find(function (opt) {
        return opt.value === this.props.preselected;
      }, this);
    } else if (this.state.selected === null) {
      selected = this.props.options[0];
    } else {
      selected = this.state.selected;
    }

    return (
      <div className='dropdown'>
        <a className='dropdown__toggle' style={{ backgroundColor: this.state.open ? '#333' : null }} href='#' onClick={this.handleToggle}>{this.props.label}: {selected.label}</a>
        <ul className='dropdown__menu' style={{ display: this.state.open ? 'block' : 'none' }}>{options}</ul>
      </div>
    );
  },

});

module.exports = Dropdown;
