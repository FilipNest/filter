# Filters

_Development site currently at [filter.filipnest.com](http://filter.filipnest.com)_

Discussion with context. Each post has some tags assigned to it, some are automatic, other are chosen, all can act as filters.

Tags are case insensitive (`Music` is the same as `MUSIC` and `music`) and can only contain letters,numbers and dashes `-` for example `social-media-websites`.

The filter box at the top can be used to add tags to the current context. Only messages with those tags will appear. Also, any message entered will get these tags automatically.

URLs are also fairly simple being a comma separated list of filters.

## Formatting messages

Italic HTML tags are allowed. Nothing else. URLS will be turned into links automatically. Hashtags and mentions (`#tag @username`) will be turned into filter links. Everything else will be stripped out.

Messages are formatted using the [typogr](https://www.npmjs.com/package/typogr) typographical library so punctuation is curled and improved.

## Automatically added tags

* The userid of the author
* A unique id for the message itself
* Any tags from the current context

## Manually adding tags

Aside from changing the context, you can add extra tags by prefixing words with the `#` symbol.

## Navigating through a message

* Author will lead you to a filter for them. All their messages and any messages tagged with them will appear here.
* Reply button will add a filter for the message id
* Filter button will lead you to the filtered context of this message
* Any tags that aren't in the current context appear above the message preceded by a `+` sign.

## Points

Messages can be voted up or down (or both currently, not sure if bug/feature).

## Special filters

* `!tag` negates the tag so makes sure it's not there.  `!world,hello` would show all things tagged with `hello` but not `world`.
* `points=value` only shows posts with points greater or equal to the value field. So `points=10` would only show posts with points greater or equal to 10.
* `author=userid` only shows posts by that author. So `author=FilipNest` would only show posts by a user with the id `FilipNest`.
* `upvoted=userid` and `downvoted=userid` returns only posts that the specified userid has upvoted/downvoted.
* `@userid` is not really a special filter, it's just a tag specific to users.

All special filters can also be preceded by a `!` to negate the filter.

## Credits

### Icons (via Noun Project)

* Reply icon by Jan-Christoph Borchardt
* Filter icon by Ismael Ruiz
