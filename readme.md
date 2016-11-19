# Filter (devname)

_Development site currently at [filter.filipnest.com](http://filter.filipnest.com)_

Discussion with context. Each post has some tags assigned to it, some are automatic, other are chosen, all can act as filters.

The filter box at the top can be used to add tags to the current context. Only messages with those tags will appear. Also, any message entered will get these tags automatically.

URLs are also fairly simple being a comma separated list of filters.

## Special filters

* `!tag` negates the tag so makes sure it's not there.  `!world,hello` would show all things tagged with `hello` but not `world`.
* `points~value` only shows posts with points greater or equal to the value field. So `points~10` would only show posts with points greater or equal to 10.
* `author~userid` only shows posts by that author. So `author~FilipNest` would only show posts by a user with the id `FilipNest`.
* `upvoted~userid` and `downvoted~userid` returns only posts that the specified userid has upvoted/downvoted.

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

## Credits

### Icons (via Noun Project)

* Reply icon by Jan-Christoph Borchardt
* Filter icon by Nimal Raj
