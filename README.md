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
       
       foo.callDrupal().then(ok);
       
     });
  },
  
  _wrapperId: 'my-wrapper-id',
  _wrapper: function(rows) {
    return {
       _theme: 'container',
       _attributes: {
         id: 'my-wrapper-id',
         class: ['row']
       },
       _children: rows
     };
  },
  
  _display: function(row) {
  
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