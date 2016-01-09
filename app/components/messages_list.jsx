let React = require('react');
let PureRenderMixin = require('react-addons-pure-render-mixin');
let ReactCSSTransitionGroup = require('react-addons-css-transition-group');
let ReactDOM = require('react-dom');
let Reflux = require('reflux');
let messagesStore = require('../stores/messages');
let Message = require('./message');
let Actions = require('../actions');
let Immutable = require('immutable');

const MessagesList = React.createClass({

  mixins: [PureRenderMixin, Reflux.connect(messagesStore, "messages")],

  getInitialState () {
    return {
      self: messagesStore.getSelf(),
    };
  },

  componentDidMount () {
    this.unsubscribe = Actions.authenticated.listen(function (d) {
      this.setState({
        self: Immutable.fromJS(d.user),
      });
    }.bind(this));
  },

  componentWillUnmount () {
    this.unsubscribe();
  },

  render () {
    let items = this.state.messages.reverse().map(function (item) {
      return <Message key={item.get('id')} data={item} baseUrl={this.props.baseUrl} self={this.state.self} />;
    }, this);

    return (
      <div className='messages-list'>
        <div className='container'>
          <ReactCSSTransitionGroup transitionName="bubble" transitionEnterTimeout={100} transitionLeaveTimeout={100}>
            {items}
          </ReactCSSTransitionGroup>
        </div>
      </div>
    );
  },

});

module.exports = MessagesList;
