# dg_pager
The Pager module for DrupalGap 8.

# REST Response

Your REST response must follow this format for the pager to work properly:

```
{
  results: [ /* your result(s) from Drupal */],
  page: 0,
  pages: 3,
  count: 38,
  limit: 16
}
```
