var _class, _temp;

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }



import { DOM, PLATFORM } from 'aurelia-pal';
import { History } from 'aurelia-history';

export var LinkHandler = function () {
  function LinkHandler() {
    
  }

  LinkHandler.prototype.activate = function activate(history) {};

  LinkHandler.prototype.deactivate = function deactivate() {};

  return LinkHandler;
}();

export var DefaultLinkHandler = function (_LinkHandler) {
  _inherits(DefaultLinkHandler, _LinkHandler);

  function DefaultLinkHandler() {
    

    var _this = _possibleConstructorReturn(this, _LinkHandler.call(this));

    _this.handler = function (e) {
      var _DefaultLinkHandler$g = DefaultLinkHandler.getEventInfo(e),
          shouldHandleEvent = _DefaultLinkHandler$g.shouldHandleEvent,
          href = _DefaultLinkHandler$g.href;

      if (shouldHandleEvent) {
        e.preventDefault();
        _this.history.navigate(href);
      }
    };
    return _this;
  }

  DefaultLinkHandler.prototype.activate = function activate(history) {
    if (history._hasPushState) {
      this.history = history;
      DOM.addEventListener('click', this.handler, true);
    }
  };

  DefaultLinkHandler.prototype.deactivate = function deactivate() {
    DOM.removeEventListener('click', this.handler);
  };

  DefaultLinkHandler.getEventInfo = function getEventInfo(event) {
    var info = {
      shouldHandleEvent: false,
      href: null,
      anchor: null
    };

    var target = DefaultLinkHandler.findClosestAnchor(event.target);
    if (!target || !DefaultLinkHandler.targetIsThisWindow(target)) {
      return info;
    }

    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return info;
    }

    var href = target.getAttribute('href');
    info.anchor = target;
    info.href = href;

    var leftButtonClicked = event.which === 1;
    var isRelative = href && !(href.charAt(0) === '#' || /^[a-z]+:/i.test(href));

    info.shouldHandleEvent = leftButtonClicked && isRelative;
    return info;
  };

  DefaultLinkHandler.findClosestAnchor = function findClosestAnchor(el) {
    while (el) {
      if (el.tagName === 'A') {
        return el;
      }

      el = el.parentNode;
    }
  };

  DefaultLinkHandler.targetIsThisWindow = function targetIsThisWindow(target) {
    var targetWindow = target.getAttribute('target');
    var win = PLATFORM.global;

    return !targetWindow || targetWindow === win.name || targetWindow === '_self' || targetWindow === 'top' && win === win.top;
  };

  return DefaultLinkHandler;
}(LinkHandler);

export function configure(config) {
  config.singleton(History, ShortUrlHistory);
  config.transient(LinkHandler, DefaultLinkHandler);
}

function stateEqual(a, b) {
  return a.fragment === b.fragment && a.query === b.query;
}

export var ShortUrlHistory = (_temp = _class = function (_History) {
  _inherits(ShortUrlHistory, _History);

  function ShortUrlHistory(linkHandler) {
    

    var _this2 = _possibleConstructorReturn(this, _History.call(this));

    _this2._isActive = false;
    _this2._onPopStateCallback = function () {
      _this2._checkUrl(false);
    };
    _this2._onHashChangeCallback = function () {
      _this2._checkUrl(true);
    };

    _this2.location = PLATFORM.location;
    _this2.history = PLATFORM.history;
    _this2.linkHandler = linkHandler;
    return _this2;
  }

  ShortUrlHistory.prototype.activate = function activate(options) {
    if (this._isActive) {
      throw new Error('History has already been activated.');
    }

    this._isActive = true;
    this.options = Object.assign({}, { root: '/' }, this.options, options);

    this.root = ('/' + this.options.root + '/').replace(rootStripper, '/');

    PLATFORM.addEventListener('popstate', this._onPopStateCallback);
    PLATFORM.addEventListener('hashchange', this._onHashChangeCallback);

    if (!this.historyState) {
      this.historyState = this._getHistoryState();
    }

    this.linkHandler.activate(this);

    if (!this.options.silent) {
      return this._loadUrl();
    }
  };

  ShortUrlHistory.prototype.deactivate = function deactivate() {
    PLATFORM.removeEventListener('popstate', this._onPopStateCallback);
    PLATFORM.removeEventListener('hashchange', this._onHashChangeCallback);
    this._isActive = false;
    this.linkHandler.deactivate();
  };

  ShortUrlHistory.prototype.getAbsoluteRoot = function getAbsoluteRoot() {
    var origin = createOrigin(this.location.protocol, this.location.hostname, this.location.port);
    return '' + origin + this.root;
  };

  ShortUrlHistory.prototype.navigate = function navigate(fragment) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$trigger = _ref.trigger,
        trigger = _ref$trigger === undefined ? true : _ref$trigger,
        _ref$replace = _ref.replace,
        replace = _ref$replace === undefined ? false : _ref$replace;

    if (fragment && absoluteUrl.test(fragment)) {
      this.location.href = fragment;
      return true;
    }

    if (!this._isActive) {
      return false;
    }

    var historyState = this._parseFragment(fragment || '');
    if (stateEqual(this.historyState, historyState) && !replace) {
      return false;
    }
    this.historyState = historyState;

    var url = this.root + '#' + historyState.fragment;

    if (fragment === '' && url !== '/') {
      url = url.slice(0, -1);
    }
    url = url.replace('//', '/');

    this.history[replace ? 'replaceState' : 'pushState'](historyState, DOM.title, url);

    if (trigger) {
      return this._loadUrl(historyState);
    }
  };

  ShortUrlHistory.prototype.navigateBack = function navigateBack() {
    this.history.back();
  };

  ShortUrlHistory.prototype.setTitle = function setTitle(title) {
    DOM.title = title;
  };

  ShortUrlHistory.prototype.getState = function getState(key) {
    var state = Object.assign({}, this.history.state);
    return state[key];
  };

  ShortUrlHistory.prototype._getHash = function _getHash() {
    return this.location.hash.substr(1);
  };

  ShortUrlHistory.prototype._parseFragment = function _parseFragment(fragment, query) {
    query = query || '';

    var queryIndex = fragment.indexOf('?');
    if (queryIndex >= 0) {
      query = fragment.slice(queryIndex + 1).trim();
      fragment = fragment.slice(0, queryIndex);
    }

    fragment = '/' + fragment.replace(routeStripper, '');

    var stateString = fragment + (query.length > 0 ? '?' + query : '');

    return { fragment: fragment, query: query, stateString: stateString };
  };

  ShortUrlHistory.prototype._getHistoryState = function _getHistoryState() {
    var hashOnlyState = this._parseFragment(this._getHash());
    if (hashOnlyState.query.length > 0) {
      return hashOnlyState;
    }
    if (hashOnlyState.fragment === this.getState('fragment')) {
      return this._parseFragment(this._getHash(), this.getState('query'));
    } else {
      var _location = this.location,
          pathname = _location.pathname,
          search = _location.search,
          hash = _location.hash;

      this.history.replaceState(hashOnlyState, null, '' + pathname + search + hash);
      return hashOnlyState;
    }
  };

  ShortUrlHistory.prototype._checkUrl = function _checkUrl(isHashChange) {
    var current = this._getHistoryState();
    if (!stateEqual(current, this.historyState)) {
      this._loadUrl(current);
    }
  };

  ShortUrlHistory.prototype._loadUrl = function _loadUrl(stateOverride) {
    if (!stateOverride) {
      stateOverride = this._getHistoryState();
    }
    this.historyState = stateOverride;

    return this.options.routeHandler ? this.options.routeHandler(this.historyState.stateString) : false;
  };

  return ShortUrlHistory;
}(History), _class.inject = [LinkHandler], _temp);

var routeStripper = /^#?\/*|\s+$/g;

var rootStripper = /^\/+|\/+$/g;

var absoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;

function createOrigin(protocol, hostname, port) {
  return protocol + '//' + hostname + (port ? ':' + port : '');
}