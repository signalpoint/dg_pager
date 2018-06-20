Pager.prototype.toInfinityAndBeyond = function() {
  var self = this;

  // By this point every row is rendered in the DOM's list and visible to the user...

  // Let's grab the list, or bail out if we can't find it.
  var list = document.getElementById(this.getVar('wrapperId'));
  if (!list) { return; }

  // Set up default options for the intersection observers.
  var intersectionObserverOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 1.0
  };

  // First item intersection observer.
  if (self.getOption('trimFromTop') && self.getPage() && self.getPagesInDom() >= self.pagesAllowed()) {
    var first = list.firstChild; // Grab the first item in the list.
    var firstItemRatio = null;
    if (this._firstObserver) {
      //console.log('disconnecting first');
      this._firstObserver.disconnect();
      delete this._firstObserver;
    }
    this._firstObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          if (entry.intersectionRatio > firstItemRatio) {
            //console.log('got to top');
            self._toInfinityAndBeyond('up');
          }
          firstItemRatio = entry.intersectionRatio;
        }
      });
    }, intersectionObserverOptions);
    this._firstObserver.observe(first);
  }

  // Last item intersection observer.
  var totalPages = self.getPages();
  if (totalPages > 1 && self.getPage() + 1 != totalPages) {
    var last = list.lastChild; // Grab the last item in the list.
    var lastItemRatio = null;
    if (this._lastObserver) {
      //console.log('disconnecting last');
      this._lastObserver.disconnect();
      delete this._lastObserver;
    }
    this._lastObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          if (entry.intersectionRatio > lastItemRatio) {
            //console.log('got to bottom');
            self._toInfinityAndBeyond('down');
          }
          lastItemRatio = entry.intersectionRatio;
        }
      });
    }, intersectionObserverOptions);
    this._lastObserver.observe(last);
  }

};

Pager.prototype._toInfinityAndBeyond = function(direction) {
  var self = this;

  // If the pager is locked (i.e. it's already trying to fill a request, aka battling against users who aggressively
  // scroll up and down), just bail out and let it unlock itself when the request is fulfilled.
  if (this.isLocked()) { return; }

  // Did we switch directions?
  var lastDirection = this.getDirection();
  var switchedDirections = lastDirection && lastDirection != direction;
  this.setDirection(direction);

  // Figure out what direction we're going.
  // What direction are we going?
  var goingDown = direction == 'down';

  // Figure out what page we're on, and what page we're going to.
  var currentPage = this.getPage();
  var pagesAllowed = this.pagesAllowed();
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

  // If we're trimming from the top, and there are too many pages in the DOM, remove the oldest one (depending on what
  // direction we're moving).
  if (self.getOption('trimFromTop') && pagesInDom >= pagesAllowed) {
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
  this.lock();
  this.fetch().then(function() {
    self.unlock();
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

  }, function() {
    // Something went wrong, i.e. the probably changed routes before the fetch call finished.
  });

};

// INFINITE SCROLL HELPERS

Pager.prototype.isInfinite = function() { return this.getVar('infinite'); };
Pager.prototype.getDirection = function() { return this._direction; };
Pager.prototype.setDirection = function(direction) { this._direction = direction; };

Pager.prototype.getRowCountInDom = function() {
  return this.getList().childElementCount;
};
Pager.prototype.pagesAllowed = function() {
  return this.getOption('pagesAllowed');
};
Pager.prototype.getPagesInDom = function() {
  return Math.ceil(this.getRowCountInDom() / this.getLimit());
};
Pager.prototype.removeFromTop = function() {
  var list = this.getList();
  var stop = this.getLimit();
  //console.log('removing from top, this many items', stop);
  for (var i = 0; i < stop; i++) {
    var child = list.childNodes[0];
    //console.log('removing', 0, i, child);
    list.removeChild(child);
  }
};
Pager.prototype.removeFromBottom = function() {
  var list = this.getList();
  var start = list.childNodes.length;
  var stop = start - this.getLimit();
  //console.log('removing bottom, from/to', start, stop);
  for (var i = start - 1; i >= stop; i--) {
    var child = list.childNodes[i];
    //console.log('removing', i, child);
    list.removeChild(child);
  }
};
