'use strict';

//var isBrowser = require('material-ui/lib/utils/is-browser');
//var Modernizr = isBrowser ? require('material-ui/lib/utils/modernizr.custom') : undefined;

var React = require('react');
var ReactDOM = require('react-dom');
var KeyCode = require('material-ui/lib/utils/key-code');
var StylePropable = require('material-ui/lib/mixins/style-propable');
var AutoPrefix = require('material-ui/lib/styles/auto-prefix');
var Transitions = require('material-ui/lib/styles/transitions');
var WindowListenable = require('material-ui/lib/mixins/window-listenable');
var Overlay = require('material-ui/lib/overlay');
var Paper = require('material-ui/lib/paper');
var Menu = require('material-ui/lib/menu/menu');
var DefaultRawTheme = require('material-ui/lib/styles/raw-themes/light-raw-theme');
var ThemeManager = require('material-ui/lib/styles/theme-manager');

var openNavEventHandler = null;

var BottomNav = React.createClass({
  displayName: 'BottomNav',

  mixins: [StylePropable, WindowListenable],

  contextTypes: {
    muiTheme: React.PropTypes.object
  },

  //for passing default theme context to children
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getChildContext: function getChildContext() {
    return {
      muiTheme: this.state.muiTheme
    };
  },

  propTypes: {
    className: React.PropTypes.string,
    disableSwipeToOpen: React.PropTypes.bool,
    docked: React.PropTypes.bool,
    header: React.PropTypes.element,
    menuItems: React.PropTypes.array,
    onChange: React.PropTypes.func,
    onNavOpen: React.PropTypes.func,
    onNavClose: React.PropTypes.func,
    selectedIndex: React.PropTypes.number,
    menuItemClassName: React.PropTypes.string,
    menuItemClassNameSubheader: React.PropTypes.string,
    menuItemClassNameLink: React.PropTypes.string,
    style: React.PropTypes.object
  },

  windowListeners: {
    'keyup': '_onWindowKeyUp',
    'resize': '_onWindowResize'
  },

  getDefaultProps: function getDefaultProps() {
    return {
      disableSwipeToOpen: false,
      docked: true
    };
  },

  getInitialState: function getInitialState() {
    this._maybeSwiping = false;
    this._touchStartX = null;
    this._touchStartY = null;
    this._swipeStartX = null;

    return {
      open: this.props.docked,
      swiping: null,
      muiTheme: this.context.muiTheme ? this.context.muiTheme : ThemeManager.getMuiTheme(DefaultRawTheme)
    };
  },

  //to update theme inside state whenever a new theme is passed down
  //from the parent / owner using context
  componentWillReceiveProps: function componentWillReceiveProps(nextProps, nextContext) {
    var newMuiTheme = nextContext.muiTheme ? nextContext.muiTheme : this.state.muiTheme;
    var newState = { muiTheme: newMuiTheme };

    if (this.props.docked !== nextProps.docked) newState.open = nextProps.docked;

    this.setState(newState);
  },

  componentDidMount: function componentDidMount() {
    this._updateMenuHeight();
    this._enableSwipeHandling();
  },

  componentDidUpdate: function componentDidUpdate() {
    this._updateMenuHeight();
    this._enableSwipeHandling();
  },

  componentWillUnmount: function componentWillUnmount() {
    this._disableSwipeHandling();
  },

  toggle: function toggle() {
    return this.state.open ? this.close() : this.open();
  },

  close: function close() {
    this.setState({ open: false });
    if (this.props.onNavClose) this.props.onNavClose();
    return this;
  },

  open: function open() {
    this.setState({ open: true });
    if (this.props.onNavOpen) this.props.onNavOpen();
    return this;
  },

  getThemePalette: function getThemePalette() {
    return this.state.muiTheme.rawTheme.palette;
  },

  getTheme: function getTheme() {
    return this.state.muiTheme.leftNav;
  },

  getStyles: function getStyles() {
    //var y = -1 * (this.state.open ? 0 : this._getMaxTranslateY());
    var y = this.state.open ? 0 : this._getMaxTranslateY();
    var styles = {
      root: {
        height: '100%',
        width: this.getTheme().width,
        position: 'fixed',
        zIndex: 10,
        //left: isBrowser && Modernizr.csstransforms3d ? 0 : y,
        left: 0,
        bottom: 0,
        transform: 'translate3d(0, ' + y + 'px, 0)',
        transition: !this.state.swiping && Transitions.easeOut(),
        backgroundColor: this.getTheme().color,
        overflow: 'hidden'
      },
      menu: {
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        borderRadius: '0'
      },
      menuItem: {
        height: this.state.muiTheme.rawTheme.spacing.desktopLeftNavMenuItemHeight,
        lineHeight: this.state.muiTheme.rawTheme.spacing.desktopLeftNavMenuItemHeight + 'px'
      }
    };

    styles.menuItemLink = this.mergeStyles(styles.menuItem, {
      display: 'block',
      textDecoration: 'none',
      color: this.getThemePalette().textColor
    });
    styles.menuItemSubheader = this.mergeStyles(styles.menuItem, {
      overflow: 'hidden'
    });

    return styles;
  },

  render: function render() {
    var selectedIndex = this.props.selectedIndex;
    var overlay = undefined;

    var styles = this.getStyles();
    if (!this.props.docked) {
      overlay = React.createElement(Overlay, {
        ref: 'overlay',
        show: this.state.open || !!this.state.swiping,
        transitionEnabled: !this.state.swiping,
        onTouchTap: this._onOverlayTouchTap });
    }
    var children = undefined;
    if (this.props.menuItems === undefined) {
      children = this.props.children;
    } else {
      children = React.createElement(Menu, {
        ref: 'menuItems',
        style: this.mergeStyles(styles.menu),
        zDepth: 0,
        menuItems: this.props.menuItems,
        menuItemStyle: this.mergeStyles(styles.menuItem),
        menuItemStyleLink: this.mergeStyles(styles.menuItemLink),
        menuItemStyleSubheader: this.mergeStyles(styles.menuItemSubheader),
        menuItemClassName: this.props.menuItemClassName,
        menuItemClassNameSubheader: this.props.menuItemClassNameSubheader,
        menuItemClassNameLink: this.props.menuItemClassNameLink,
        selectedIndex: selectedIndex,
        onItemTap: this._onMenuItemClick });
    }
    return React.createElement(
      'div',
      { className: this.props.className },
      overlay,
      React.createElement(
        Paper,
        {
          ref: 'clickAwayableElement',
          zDepth: 2,
          rounded: false,
          transitionEnabled: !this.state.swiping,
          style: this.mergeStyles(styles.root, this.props.style) },
        this.props.header,
        children
      )
    );
  },

  _updateMenuHeight: function _updateMenuHeight() {
    if (this.props.header) {
      var menu = ReactDOM.findDOMNode(this.refs.menuItems);
      if (menu) {
        var container = ReactDOM.findDOMNode(this.refs.clickAwayableElement);
        var menuHeight = container.clientHeight - menu.offsetTop;
        menu.style.height = menuHeight + 'px';
      }
    }
  },

  _onMenuItemClick: function _onMenuItemClick(e, key, payload) {
    if (this.props.onChange && this.props.selectedIndex !== key) {
      this.props.onChange(e, key, payload);
    }
    if (!this.props.docked) this.close();
  },

  _onOverlayTouchTap: function _onOverlayTouchTap() {
    this.close();
  },

  _onWindowKeyUp: function _onWindowKeyUp(e) {
    if (e.keyCode === KeyCode.ESC && !this.props.docked && this.state.open) {
      this.close();
    }
  },

  _onWindowResize: function _onWindowResize() {
    this._updateMenuHeight();
  },

  _getMaxTranslateY: function _getMaxTranslateY() {
    // TODO: fix height access console.log("--> ThemeHeight", this.getTheme().height, ", MenuHeight", this._updateMenuHeight());
    //return this.getTheme().height + 10;
    return 260;
  },

  _enableSwipeHandling: function _enableSwipeHandling() {
    if (!this.props.docked) {
      document.body.addEventListener('touchstart', this._onBodyTouchStart);
      if (!openNavEventHandler) {
        openNavEventHandler = this._onBodyTouchStart;
      }
    } else {
      this._disableSwipeHandling();
    }
  },

  _disableSwipeHandling: function _disableSwipeHandling() {
    document.body.removeEventListener('touchstart', this._onBodyTouchStart);
    if (openNavEventHandler === this._onBodyTouchStart) {
      openNavEventHandler = null;
    }
  },

  _onBodyTouchStart: function _onBodyTouchStart(e) {
    if (!this.state.open && (openNavEventHandler !== this._onBodyTouchStart || this.props.disableSwipeToOpen)) {
      return;
    }

    var touchStartX = e.touches[0].pageX;
    var touchStartY = e.touches[0].pageY;

    this._maybeSwiping = true;
    this._touchStartX = touchStartX;
    this._touchStartY = touchStartY;

    document.body.addEventListener('touchmove', this._onBodyTouchMove);
    document.body.addEventListener('touchend', this._onBodyTouchEnd);
    document.body.addEventListener('touchcancel', this._onBodyTouchEnd);
  },

  _setPosition: function _setPosition(translateY) {
    var bottomNav = ReactDOM.findDOMNode(this.refs.clickAwayableElement);
    var transformCSS = 'translate3d(0, ' + -translateY + 'px, 0, 0)';
    this.refs.overlay.setOpacity(1 - translateY / this._getMaxTranslateY());
    AutoPrefix.set(bottomNav.style, 'transform', transformCSS);
  },

  _getTranslateY: function _getTranslateY(currentY) {
    // TODO: check sign
    return Math.min(Math.max(this.state.swiping === 'closing' ?
            -1 * (this._swipeStartY - currentY) :
            this._getMaxTranslateY() + (currentY - this._swipeStartY), 0), this._getMaxTranslateY());
  },

  _onBodyTouchMove: function _onBodyTouchMove(e) {
    var currentX = e.touches[0].pageX;
    var currentY = e.touches[0].pageY;

    if (this.state.swiping) {
      e.preventDefault();
      this._setPosition(this._getTranslateY(currentY));
    } else if (this._maybeSwiping) {
      var dXAbs = Math.abs(currentX - this._touchStartX);
      var dYAbs = Math.abs(currentY - this._touchStartY);
      // If the user has moved his thumb ten pixels in either direction,
      // we can safely make an assumption about whether he was intending
      // to swipe or scroll.
      var threshold = 10;

      console.log("_onBodyTouchMove:: ", currentX, currentY, this.state.swiping, this._maybeSwiping);
      if (dXAbs <= threshold && dYAbs > threshold) {
        this._swipeStartY = currentY;
        this.setState({
          swiping: this.state.open ? 'closing' : 'opening'
        });
        this._setPosition(this._getTranslateY(currentY));
      } else if (dXAbs > threshold && dYAbs <= threshold) {
        this._onBodyTouchEnd();
      }
    }
  },

  _onBodyTouchEnd: function _onBodyTouchEnd(e) {
    if (this.state.swiping) {
      var currentY = e.changedTouches[0].pageY;
      var translateRatio = this._getTranslateY(currentY) / this._getMaxTranslateY();

      this._maybeSwiping = false;
      var swiping = this.state.swiping;
      this.setState({
        swiping: null
      });

      // We have to open or close after setting swiping to null,
      // because only then CSS transition is enabled.
      if (translateRatio > 0.5) {
        if (swiping === 'opening') {
          this._setPosition(this._getMaxTranslateY());
        } else {
          this.close();
        }
      } else {
        if (swiping === 'opening') {
          this.open();
        } else {
          this._setPosition(0);
        }
      }
    } else {
      this._maybeSwiping = false;
    }

    document.body.removeEventListener('touchmove', this._onBodyTouchMove);
    document.body.removeEventListener('touchend', this._onBodyTouchEnd);
    document.body.removeEventListener('touchcancel', this._onBodyTouchEnd);
  }

});

module.exports = BottomNav;