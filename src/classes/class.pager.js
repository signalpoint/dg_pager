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

  // Prep the minimum POST data for the Service Resource.
  // @TODO this is for D7 Services, not D8 REST.
  this._data = {
    page: typeof variables._page !== 'undefined' ? variables._page : 0,
    limit: variables._limit ? variables._limit : 10
  };

  // Set up default options for infinite scroll if it is configured for infinite.
  if (variables._infinite && !variables._infiniteOps) {
    variables._infiniteOps = { pagesAllowed: 2 };
    this._firstObserver = null;
    this._lastObserver = null;
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

// @see include.infinity.js for more goodness
