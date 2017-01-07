# Filters

_Development site currently at [filters.social](https://filters.social)_

Filters is a demo/concept of a decentralised social messaging platform with a focus on context. It's a bit like Twitter if you could filter away all the things you did and didn't want to read and have discussions on a specific topic.

Each post has context tags set on it which you can use to have discussions in that same context but you can also filter by who wrote the post, how many upvotes/downvotes it's got, who upvoted/downvoted it and more. The bottom of this page has all the filters you can currently use.

Have a play at filters.social or deploy your own instance (instructions below) and add any thoughts to the issue queue here on GitHub. Feedback and contributions would be hugely appreciated.

## Author's reasons for making this

### 1) Context and control over what's on your feed

I love Twitter, everyone keeps wanting to replace it but I still love it. One thing that annoys me though is that sometimes the lack of a context behind a feed makes it seem like everyone's just shouting over each other about things. I mostly tweet about music but, in a year of a lot of big political events and other things, my tweets about music seem a bit funny next to everything else. I've even seen people get annoyed with others about tweeting something irrelevant to what they want to hear about.

I grew up on message boards (mostly music ones) and chat rooms (games). Both had closed contexts and communities where you could discuss one thing without being distracted or pushed into discussing other things.

Filters' messages are all tagged and you can add context to a stream and shift within contexts to filter out anything (or anyone). 

Additional filters for things such as who wrote a post, who upvoted/downvoted it or how many points it has (all filters can also be negated and combined) allow you to have full control over what you see. You can also share or bookmark these contexts as all they are is simple to write out urls.

### 2) Decentralisation

Storing all messages on one company's servers means you're forced to follow whatever advertising, privacy and content policies that company puts forward. Filters is decentralised. Any instance can listen to messages from any other instance (go into your personal preferences and type some urls in for channels you want to read, if they're hosting Filters instances the messages will be pulled into your feed and filtered just like the other messages). This isn't just for privacy, it allows you to create copies of the same software (it's open source) that support different features or look different but still understand messages from other instances.

## How it works

Messages posted to Filters are all tagged. Some tags are automatic e.g the author and a unique ID for the message (prefixed with `msg-`), some are manual, e.g `#hashtags`, `@mentions` and all the tags in the context the message is being posted to.

Readers/writers can filter a discussion down to a specific context by adding tags to a header at the top of the message feed. Tags can be negated with a `!` prefix to show everything except those tags and there are all sorts of special tags for things such as who wrote the post and how many/which people liked it or disliked it. These special tags can also be negated and combined.

Tags are case insensitive (`Music` is the same as `MUSIC` and `music`) and can only contain letters, numbers and dashes `-` for example `social-media-websites`. (And `@` prefixes for users).

URLs for specific contexts are a comma separated list of filters so you can easily link people to specific contexts you have created.

Users might want to have certain filters on by default while navigating through the system. For example blocking specific users or only showing posts that have a minimum number of points (/votes). Each user can set a static set of filters that follows them around while they dip in and out of contexts. Once logged in you'll find this on your settings screen.

### Channels

If you know of multiple instances/servers of the Filters software running you can listen to all of them just by adding the urls to the external channel box in your settings (see the bit about decentralisation above for more info).

### Formatting messages

Italic HTML tags are allowed, URLS will be turned into links automatically, hashtags and mentions (`#tag @username`) will be turned into filter links. Everything else will be stripped out. Future plugins will allow images and other content, for now it's text only.

Messages are formatted using the [typogr](https://www.npmjs.com/package/typogr) typographical library so punctuation is curled and improved.

### Automatically added tags

* The userid of the author
* A unique id for the message itself (always prefixed with `msg-`)
* Any tags from the current context (switch context if you want to write in a different one)

### Manually adding tags

Aside from changing the context, you can add extra tags by prefixing words with the `#` symbol. Mentions are pretty much the same prefixed with a `@` and are also added to the message's tags.

### Navigating through a message

* Author will lead you to a filter for them. All their messages will appear here. It's kinda like a profile page but there are no profile pages. Just discussion contexts.
* Reply button will add a filter for the message id and mention the author.
* Filter button will lead you to the filtered context of this message (if it's different from the current context, it's not visible if the context is the same).
* Any tags that aren't in the current context appear above the message preceded by a `+` sign.

### Points

Messages can be voted up or down (or both currently, not sure if bug/feature!). This is useful for filtering away good or bad content. One upvote and one downvote per user per message.

### Special filters

* `!tag` negates the tag so makes sure it's not there.  `!world,hello` would show all things tagged with `hello` but not `world`.
* `minpoints=value` only shows posts with points greater or equal to the value field. So `minpoints=10` would only show posts with points greater or equal to 10.
* `author=userid` only shows posts by that author. So `author=FilipNest` would only show posts by a user with the id `FilipNest`.
* `upvoted=userid` and `downvoted=userid` returns only posts that the specified userid has upvoted/downvoted.
* `@userid` is not really a special filter, it's just a tag specific to users.
* `@@userid` is like mentions but only users with that user id will be able to see the message. Private messaging.

All special filters can also be preceded by a `!` to negate the filter.

## Deploying Filters yourself

* Git clone or download this.
* Run `npm install`
* Run `node start.js`

### The config file

Put in a file called `config.json` and in it (JSON format) put the following options if you want to configure your filters instance:

* port - which port should filters run on?
* secret - a secret key used for signing cookies, if you don't specify this a random one will be created on startup but that means your sessions won't be persistent between server restarts.
* pageSize - how many messages to show in one page.

## Help!

Filters is free and open source and I would very much like your help. Whether it's suggestions, code or design, everything would be very much appreciated.

The code is still being tidied up after the initial get-all-the-features-in but if you want to make improvements to anything please do so and put in a pull request so they can be merged in.

## License

Filters is released under the ISC license.

## Credits

### Icons (via Noun Project)

* Reply icon by Jan-Christoph Borchardt
* Filter icon by Ismael Ruiz
* Picture icon by Suavis
* Lock icon by Edward Boatman
