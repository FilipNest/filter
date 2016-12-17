# Filters

_Development site currently at [filter.filipnest.com](http://filter.filipnest.com)_

Filters is a social messaging platform with a focus on context filtering. Messages posted to it are all tagged. Some tags are automatic e.g the author and a unique ID for the message, some are manual (#hashtags, @mentions and all the tags in the context the message is being posted to.

Readers/writers can filter a discussion down to a specific context by adding tags to a header at the top of the message feed. Tags can be negated to show everything except those tags and there are all sorts of special tags for things such as who wrote the post and how many people liked it or disliked it. These special tags can also be negated and combined.

Tags are case insensitive (`Music` is the same as `MUSIC` and `music`) and can only contain letters,numbers and dashes `-` for example `social-media-websites`.

URLs for specific contexts are a comma separated list of filters.

Users might want to have certain filters on by default while navigating through the system such as blocking specific users or only showing posts that have a minimum number of points (/votes). For this reason each user can set a static set of filters that follows them around while they dip in and out of contexts.

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
* `minpoints=value` only shows posts with points greater or equal to the value field. So `minpoints=10` would only show posts with points greater or equal to 10.
* `author=userid` only shows posts by that author. So `author=FilipNest` would only show posts by a user with the id `FilipNest`.
* `upvoted=userid` and `downvoted=userid` returns only posts that the specified userid has upvoted/downvoted.
* `@userid` is not really a special filter, it's just a tag specific to users.

All special filters can also be preceded by a `!` to negate the filter.

## Credits

### Icons (via Noun Project)

* Reply icon by Jan-Christoph Borchardt
* Filter icon by Ismael Ruiz
