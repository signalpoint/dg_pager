/**
 *
 * @param id
 * @param variables
 *  'fetcher'
 *  'display'
 *  'infinite'
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

  // Add this pager to the globals for reference.
  dg._pagers[this.id()] = this;

};

Pager.prototype.id = function() { return this._id; }; // @TODO the wrapper is here, not down below where "list" should be.
Pager.prototype.getVars = function() { return this._variables; };
Pager.prototype.getVar = function(name) { return this.getVars()['_' + name]; };
Pager.prototype.getFetcher = function() { return this.getVar('fetcher'); };
Pager.prototype.getWrapperId = function() { return this.getVar('wrapperId'); }; // @TODO this is the "list" as opposed to the wrapper
Pager.prototype.getWrapper = function() { return this.getVar('wrapper'); };
Pager.prototype.getWrapperTheme = function() { return this.getWrapper()({})._theme; };
Pager.prototype.getDisplay = function() { return this.getVar('display'); }; // @TODO rename to rowCallback

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
    fetcher(self.getQuery()).then(function(data) {
      self.setData(data);
      ok();
    });
  });
};
Pager.prototype.render = function() {
  var self = this;
  return new Promise(function(ok, err) {
    self.fetch().then(function() {

      var isInfinite = self.isInfinite();

      var rows = self.renderRows();

      var pager = !isInfinite ? self.renderPager() : '';
      dg.qs('#' + self.id()).innerHTML = dg.render(self.getWrapper()(rows)) + pager;

      if (isInfinite) {
        self.toInfinityAndBeyond();
        if (ok) { ok(); }
      }
      else { ok(); }

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
    //dg.attributesInit(item);
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
    //rows.push(dg_bootstrap.prepListItem(item)); // @TODO bootstrap item list only.
  }
  //this.getResults().forEach(function(row) {
  //  var display = self.getDisplay();
  //  var item = display.call(self, row);
  //  rows.push(dg_bootstrap.prepListItem(item));
  //});
  //console.log('rows', rows);
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

Pager.prototype.addEvents = function() {
  console.log(this.id(), 'adding events');

  var self = this;
  // Attach our scroll handler to the window to watch for the last list item to come into view.
  if (window.addEventListener) {
    var eventListeners = dg_pager.infiniteScrollEventListeners();
    eventListeners.forEach(function(name) {
      addEventListener(name, self.onVisibilityChangeHandler, false);
    });
  } else if (window.attachEvent)  { // IE9+ :(
    var events = dg_pager.infiniteScrollEvents();
    events.forEach(function(name) {
      attachEvent(name, self.onVisibilityChangeHandler, false);
    });
  }
  self._eventsAdded = true;
};

Pager.prototype.removeEvents = function() {
  console.log(this.id(), 'removing events');

  var self = this;

  // Immediately remove the handler so it doesn't trigger on this element again.
  if (window.removeEventListener) {
    var eventListeners = dg_pager.infiniteScrollEventListeners();
    for (var i = 0; i < eventListeners.length; i++) {
      removeEventListener(eventListeners[i], self.onVisibilityChangeHandler);
    }
  } else if (window.removeEvent)  { // IE9+ :(
    var events = dg_pager.infiniteScrollEvents();
    for (var j = 0; j < events.length; j++) {
      removeEvent(events[j], self.onVisibilityChangeHandler);
    }
  }
  self._eventsAdded = false;
};

Pager.prototype.toInfinityAndBeyond = function() {
  var self = this;
  var theme = this.getWrapperTheme();

  // Grab the last item from data results.
  var list = document.getElementById(this.getVar('wrapperId'));
  var el = list ? list.lastChild : null;

  // Set up a handler to watch for the list item to come into view.
  this.onVisibilityChangeHandler = onVisibilityChange(el, function(visible) {

    if (visible) {
      console.log('got to bottom!!', self.id());

      self.removeEvents();

      var which = 'next';
      var currentPage = self.getPage();
      var destinationPage = which == 'next' ? currentPage + 1 : currentPage - 1;
      if (destinationPage < 0) { return; } // reached the first page.
      else if (destinationPage >= self.getPages()) { return; } // Reached the last page.
      self.setPage(destinationPage);
      self.fetch().then(function() {

        // @TODO need to update the first/last classes here.
        var rows = self.renderRows();
        var html = '';
        for (var i = 0; i < rows.length; i++) {
          var item = rows[i];
          switch (theme) {

            case 'bootstrap_item_list':
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
        dg.qs('#' + self.getWrapperId()).innerHTML += html;

        self.toInfinityAndBeyond();

      });

    }

  });

  self.addEvents();

};

Pager.prototype.onVisibilityChangeHandler = function() {
  return null; // Empty prototype which is overwritten inside of toInfinityAndBeyond().
};
