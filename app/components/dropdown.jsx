let React = require('react');

const Dropdown = React.createClass({

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

  render () {
    let options = this.props.options.map(function (option) {
      return (<li key={option.value}><a href='#' onClick={this.handleSelect.bind(this, option)}>{option.label}</a></li>);
    }, this);

    let selected;

    if (this.state.selected === null && typeof this.props.preselected !== 'undefined') {
      selected = this.props.preselected;
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
