# dg_pager

The Pager module for DrupalGap 8 allows developers to add paging to their widgets. Create lists of items that can easily
be paged through, or infinitely scrolled through.

## REST Response

Your REST response must follow this format for the pager to work properly:

```

{
  results: [ /* your result(s) from Drupal */ ],
  page: 0,
  pages: 3,
  count: 38,
  limit: 16
}

```

```
var html = dg.render({
                     
  _theme: 'pager',
  _infinite: true,
  _attributes: {
     id: 'my-container-id'
  },
  
  _fetcher: function(query) {
  
    // Query for the data and then resolve.
    return new Promise(function(ok, err) {

      query.stuff = 123;
      foo.callDrupal(query).then(ok);

    });

  },
  
  _wrapperId: 'my-wrapper-id',
  _wrapper: function(rows) {
    return {
       _theme: 'container',
       _type: 'ul',
       _attributes: {
         id: 'my-wrapper-id',
         class: [
           'my-list-group'
         ]
       },
       _children: rows
     };
  },
  
  _display: function(row) {

    // You can return an html string...
    return '<li class="my-list-group-item">' + row.foo + '</li>'
  
    // Or you can return a render object for more complex widgets.
    return {
      _text: {
        _markup: '...',

        /* ... OR ... */

        _theme: 'foo',
      }
    };
  
  },
  
  _empty: function() {
    return '<p>' + dg.t('No content found.') + '</p>';
  },
  
  _done: function() {
  
    // Do something once each row is done rendering...
  
  }
  
});
```

## Infinite Scrolling

When using the `_infinite` property, you can additionally attach an `_infiniteOps` object to add options for the
infinite scroll widget:

```
 _infinite: true,
 _infiniteOps: {
   trimFromTop: true,
   pagesAllowed: 32
 }
```

See [class.pager.js](https://github.com/signalpoint/dg_pager/blob/8.x-1.x/src/classes/class.pager.js) for full details about `_infiniteOps`.