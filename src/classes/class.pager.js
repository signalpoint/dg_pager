/**
 *
 * @param id
 * @param variables
 *  '_fetcher'
 *  '_display'
 *  '_infinite'
 *  '_infiniteOps' {Object}
 *      pagesAllowed {Number}
 */
var Pager = function(id, variables) {

  this._id = id;
  this._variables = variables;
  this._query = null;

  this._eventsAdded = false;

  // Prep the minimum POST data for the Service Resource.
  // @TODO this is for D7 Services, not D8 REST.
  this._data = {
    page: typeof variables._page !== 'undefined' ? variables._page : 0,
    limit: variables._limit ? variables._limit : 10
  };

  // Set up default options for infinite scroll if it is configured for infinite.
  if (variables._infinite && !variables._infiniteOps) {
    variables._infiniteOps = { pagesAllowed: 2 };
  }

  // Add this pager to the globals for reference.
  dg._pagers[this.id()] = this;

};

Pager.prototype.id = function() { return this._id; };
Pager.prototype.getVars = function() { return this._variables; };
Pager.prototype.getVar = function(name) { return this.getVars()['_' + name]; };
Pager.prototype.getOption = function(name) { return this.getVars()._infiniteOps[name]; };

Pager.prototype.getFetcher = function() { return this.getVar('fetcher'); };

// @TODO rename to container.
Pager.prototype.getWrapperId = function() { return this.getVar('wrapperId'); }; // @TODO this is the "list" as opposed to the wrapper
Pager.prototype.getWrapper = function() { return this.getVar('wrapper'); };
Pager.prototype.getWrapperTheme = function() { return this.getWrapper().call(this, {})._theme; };
// @TODO rename to row.
Pager.prototype.getDisplay = function() { return this.getVar('display'); };
Pager.prototype.getEmpty = function() { return this.getVar('empty'); };
Pager.prototype.runDone = function() {
  var done = this.getVar('done');
  if (done) { done.call(this); }
};

Pager.prototype.getList = function() { return dg.qs('#' + this.getWrapperId()); };
Pager.prototype.getItems = function() { return this.getList().children; };
Pager.prototype.getItem = function(index) { return this.getItems()[index]; };

Pager.prototype.setData = function(data) { this._data = data; };
Pager.prototype.setPage = function(page) { this.getData().page = page; };
Pager.prototype.setPages = function(pages) { this.getData().pages = pages; };
Pager.prototype.setLimit = function(limit) { this.getData().limit = limit; };
Pager.prototype.setCount = function(count) { this.getData().count = count; };
Pager.prototype.setQuery = function(query) { this._query = query; };

Pager.prototype.getData = function(name) { return name ? this._data[name] : this._data; };
Pager.prototype.getResults = function() { return this.getData('results'); };
Pager.prototype.getResultCount = function() {
  var results = this.getResults();
  return results ? results.length : 0;
};
Pager.prototype.getPage = function() { return this.getData('page'); };
Pager.prototype.getPages = function() { return this.getData('pages'); };
Pager.prototype.getLimit = function() { return this.getData('limit'); };
Pager.prototype.getCount = function() { return this.getData('count'); };
Pager.prototype.getQuery = function() { return this._query; };

Pager.prototype.html = function() {
  var attrs = dg.attributes(this.getVar('attributes'));
  return '<div ' + attrs + '></div>';
};

Pager.prototype.fetch = function() {
  var self = this;
  var fetcher = this.getFetcher();
  this.setQuery({
    page: this.getPage(),
    pageSize: this.getLimit()
  });
  return new Promise(function(ok, err) {
    fetcher.call(self, self.getQuery()).then(function(data) {
      self.setData(data);
      ok();
    });
  });
};

Pager.prototype.render = function() {
  var self = this;
  return new Promise(function(ok, err) {
    self.fetch().then(function() {

      var el = dg.qs('#' + self.id());
      if (!self.getResultCount()) {
        var empty = self.getEmpty();
        if (empty) { el.innerHTML = dg.render(empty.call(self)); }
      }
      else {
        var isInfinite = self.isInfinite();
        var rows = self.renderRows();
        var pager = !isInfinite ? self.renderPager() : '';
        var container = self.getWrapper().call(self, rows);
        el.innerHTML = dg.render(container) + pager;
        if (isInfinite) {
          self.runDone();
          self.toInfinityAndBeyond();
          if (ok) { ok(); }
        }
        else { ok(); }
      }

    });
  });

};

Pager.prototype.renderRows = function() {
  var self = this;
  var rows = [];
  var results = this.getResults();
  var isInfinite = this.isInfinite();
  var total = results.length;
  var display = self.getDisplay();
  for (var i = 0; i < total; i++) {
    var row = results[i];
    var item = display.call(self, row);

    // Support plain strings and plain markup by converting it into our expected render element.
    if (dg.isString(item)) { item = { _text: item }; }
    if (dg.isString(item._text)) { item._text = { _markup: item._text }; }

    dg.attributesInit(item._text);

    // Set up some nice css classes for the row.
    var itemClasses = item._text._attributes.class;
    itemClasses.push(i % 2 ? 'even' : 'odd');

    if (isInfinite) {
      if (i == 0 && self.getPage() == 0) { itemClasses.push('first'); } // First page only.
      else if (i == total - 1) { itemClasses.push('last'); } // @TODO remove 'last' class as infinite page changes
    }
    else {
      if (i == 0) { itemClasses.push('first'); }
      else if (i == total - 1) { itemClasses.push('last'); }
    }

    rows.push(item);
  }

  return rows;
};

Pager.prototype.renderPager = function() {
  var id = this.id();
  var previousBtn = this.getPage() != 0 ? dg.b(dg.t('Go back'), {
    _attributes: {
      onclick: "dg_pager.onclickHandler('" + id + "', 'prev')"
    }
  }) : '';
  var nextBtn = this.getPage() != this.getPages() - 1 ? dg.b(dg.t('Load more'), {
    _attributes: {
      onclick: "dg_pager.onclickHandler('" + id + "', 'next')"
    }
  }) : '';
  return previousBtn + nextBtn;
};

// INFINITE SCROLL HELPERS

Pager.prototype.isInfinite = function() { return this.getVar('infinite'); };
Pager.prototype.eventsAdded = function() { return this._eventsAdded; };
Pager.prototype.getDirection = function() { return this._direction; };
Pager.prototype.setDirection = function(direction) { this._direction = direction; };

Pager.prototype.getRowCountInDom = function() {
  return this.getList().childElementCount;
};
Pager.prototype.getPagesInDom = function() {
  return Math.ceil(this.getRowCountInDom() / this.getLimit());
};
Pager.prototype.removeFromTop = function() {
  //console.log('removing from top');
  var list = this.getList();
  var stop = this.getLimit();
  //console.log('removing this many items', stop);
  for (var i = 0; i < stop; i++) {
    var child = list.childNodes[0];
    //console.log('removing', 0, i, child);
    list.removeChild(child);
  }
};
Pager.prototype.removeFromBottom = function() {
  //console.log('removing from bottom');
  var list = this.getList();
  var start = list.childNodes.length;
  var stop = start - this.getLimit();
  //console.log('removing from/to', start, stop);
  for (var i = start - 1; i >= stop; i--) {
    var child = list.childNodes[i];
    //console.log('removing', i, child);
    list.removeChild(child);
  }
};

Pager.prototype.addEvents = function() {
  //console.log(this.id(), 'adding events');

  var self = this;

  // Attach our scroll handler to the window to watch for the last list item to come into view.
  if (window.addEventListener) {
    var eventListeners = dg_pager.infiniteScrollEventListeners();
    eventListeners.forEach(function(name) {
      addEventListener(name, self.onVisibilityChangeHandler, { passive: true });
      addEventListener(name, self.firstItemOnVisibilityChangeHandler, { passive: true });
    });
  } else if (window.attachEvent)  { // IE9+ :(
    var events = dg_pager.infiniteScrollEvents();
    events.forEach(function(name) {
      attachEvent(name, self.onVisibilityChangeHandler, false);
      attachEvent(name, self.firstItemOnVisibilityChangeHandler, false);
    });
  }
  self._eventsAdded = true;
};

Pager.prototype.removeEvents = function() {
  //console.log(this.id(), 'removing events');

  var self = this;

  // Immediately remove the handler so it doesn't trigger on this element again.
  if (window.removeEventListener) {
    var eventListeners = dg_pager.infiniteScrollEventListeners();
    for (var i = 0; i < eventListeners.length; i++) {
      removeEventListener(eventListeners[i], self.onVisibilityChangeHandler);
      removeEventListener(eventListeners[i], self.firstItemOnVisibilityChangeHandler);
    }
  } else if (window.removeEvent)  { // IE9+ :(
    var events = dg_pager.infiniteScrollEvents();
    for (var j = 0; j < events.length; j++) {
      removeEvent(events[j], self.onVisibilityChangeHandler);
      removeEvent(events[j], self.firstItemOnVisibilityChangeHandler);
    }
  }
  self._eventsAdded = false;
};

Pager.prototype.toInfinityAndBeyond = function() {
  var self = this;

  // By this point every row is rendered in the DOM's list and visible to the user...

  // Let's grab the list, or bail out if we can't find it.
  var list = document.getElementById(this.getVar('wrapperId'));
  if (!list) { return; }

  // Grab the first item in the list.
  var first = list.firstChild;

  this.firstItemOnVisibilityChangeHandler = onVisibilityChange(first, function(visible) {

    if (visible) {
      //console.log('got to top!!', self.id());

      // If we're at the top of the first page, just skip the fact that the first item has come back into the view port.
      if (self.getPage() === 0) {
        //console.log('was at top of page zero, do nothing...');
        return;
      }

      self.removeEvents();
      self._toInfinityAndBeyond('up');

    }

  });

  // Grab the last item in the list.
  var el = list.lastChild;

  // Set up a handler to watch for the last list item to come into view.
  this.onVisibilityChangeHandler = onVisibilityChange(el, function(visible) {

    if (visible) {
      //console.log('got to bottom!!', self.id());

      // @TODO catch when we're on the very last page? similar to what we do for the first page above?
      // If we're at the bottom of the very last page, just skip the fact that the last item has come back into the view
      // port.
      if (self.getPage() + 1 == self.getPages()) {
        //console.log('was at bottom of the last page, do nothing...');
        return;
      }

      self.removeEvents();
      self._toInfinityAndBeyond('down');
    }

  });

  self.addEvents();
  //console.log('----------------------');

};

Pager.prototype._toInfinityAndBeyond = function(direction) {
  var self = this;

  // Did we switch directions?
  var lastDirection = this.getDirection();
  var switchedDirections = lastDirection && lastDirection != direction;
  this.setDirection(direction);

  // Figure out what direction we're going.
  // What direction are we going?
  var goingDown = direction == 'down';

  // Figure out what page we're on, and what page we're going to.
  var currentPage = this.getPage();
  var pagesAllowed = this.getOption('pagesAllowed');
  var destinationPage = null;
  if (goingDown) {
    destinationPage = switchedDirections ? currentPage + pagesAllowed : currentPage + 1;
  }
  else {
    destinationPage = switchedDirections ? currentPage - pagesAllowed : currentPage - 1;
  }
  //console.log('----- (switched: ' + switchedDirections + ') ' + currentPage + ' => ' + destinationPage + ' -----');

  // Stop if we reached the end.
  if (
      destinationPage < 0 || // Reached the first page.
      destinationPage >= this.getPages() // Reached the last page.
  ) { return; }


  // Set up some helper vars.
  var theme = this.getWrapperTheme();
  var pagesInDom = this.getPagesInDom();
  //console.log('currentPage', currentPage);
  //console.log('destinationPage', destinationPage);
  //console.log('pagesInDom', pagesInDom);

  // If there are too many pages in the DOM, remove the oldest one (depending on what direction we're moving).
  if (pagesInDom >= pagesAllowed) {
    //console.log('too many pages in the DOM...');
    var scrollTo = null;
    if (goingDown) {
      this.removeFromTop();
      scrollTo = this.getLimit() * (pagesAllowed - 1) - 1;
      //console.log('scrolling down to', scrollTo);
      this.getItem(scrollTo).scrollIntoView({block: "end", inline: "start"});
    }
    else {
      this.removeFromBottom();
      scrollTo = this.getLimit() - 1;
    }
  }

  // Set the new page and fetch the data.
  this.setPage(destinationPage);
  this.fetch().then(function() {

    // @TODO need to update the first/last classes here.

    // Render all the rows. Note, many developers will return a render element here so the rows wont' technically be
    // rendered yet in every case, that's why we run them through the render layer below. This allows a row to be
    // its own render element, for maximum flexibility.
    var rows = self.renderRows();

    // Now that all of the rows are ready, iterate over each, then render and append them to our result html.
    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var item = rows[i];
      switch (theme) {

        case 'item_list':
        case 'bootstrap_item_list':
          if (theme == 'bootstrap_item_list') { dg_bootstrap.prepListItem(item); }
          html += dg.render({
            _theme: 'list_item',
            _item: item,
            _i: (i * destinationPage) + i,
            _total: rows.length
          });
          break;

        case 'container':
          html += dg.render(item);
          break;

      }

    }

    // Append/prepend the html onto the list depending on which direction we're going.
    var list = dg.qs('#' + self.getWrapperId());
    if (goingDown) { list.innerHTML += html; }
    else {
      list.insertAdjacentHTML("afterbegin", html);
      scrollTo = self.getLimit() - 1;
      //console.log('scrolling up to', scrollTo);
      self.getItem(scrollTo).scrollIntoView();
    }

    self.runDone();
    self.toInfinityAndBeyond();

  });

};

Pager.prototype.onVisibilityChangeHandler = function() {
  return null; // Empty prototype which is overwritten inside of toInfinityAndBeyond().
};

Pager.prototype.firstItemOnVisibilityChangeHandler = function() {
  return null; // Empty prototype which is overwritten inside of toInfinityAndBeyond().
};
