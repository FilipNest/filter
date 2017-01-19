# Filters

_Experimental development site currently at [filters.social](https://filters.social). Feedback/help hugely appreciated._

Filters is a demo/concept/experiment of a decentralised social messaging platform with a focus on context. It's a bit like Twitter if you could filter away all the things you did and didn't want to read and have discussions on a specific topic with specific people while filtering out content you don't want based on topic, author, points the post has and more.

You can switch contexts easily by typing tags into a big context box at the top of the page but can also set default contexts and filters for yourself to only show content by specific users (or not by specific users) or content that has a certain amount of points throughout the whole system.

Have a play at [filters.social](https://filters.social) or deploy your own instance (instructions below) and add any thoughts to the issue queue here on GitHub. Feedback and contributions would be hugely appreciated.

The decentralised bit means you can run your own copy of it (it's free and open source) and communicate with other copies. 

Developers can even switch the database they want to use via a database API. Deploy a copy using the instructions in the deployment section and play around. There's also a REST and websockets API to help development.

### Automatically added tags

* The userid of the author
* A unique id for the message itself (always prefixed with `msg-`)
* Any tags from the current context (switch context if you want to write in a different one)

### Manually adding tags

Aside from changing the context in the context box, you can add extra tags by prefixing words with the `#` symbol. Mentions are pretty much the same prefixed with a `@` and are also added to the message's tags. Double `@@` is a private message.

### Points

Messages can be voted up or down (or both currently, not sure if bug/feature!). This is useful for filtering away good or bad content. One upvote and one downvote per user per message.

### Special filters

* `!tag` negates the tag so makes sure it's not there.  `!world,hello` would show all things tagged with `hello` but not `world`.
* `minpoints=value` only shows posts with points greater or equal to the value field. So `minpoints=10` would only show posts with points greater or equal to 10.
* `author=userid` only shows posts by that author. So `author=FilipNest` would only show posts by a user with the id `FilipNest`.
* `upvoted=userid` and `downvoted=userid` return only posts that the specified userid has upvoted/downvoted.
* `@userid` is not really a special filter, it's just a tag specific to users.
* `@@userid` is like mentions but only users with that user id will be able to see the message. Private messaging.

All special filters can also be preceded by a `!` to negate the filter.

### Navigating through a message

* Author will lead you to a filter for them. All their messages will appear here. It's kinda like a profile page but there are no profile pages. Just discussion contexts.
* Reply button will add a filter for the message id and mention the author.
* Filter button will lead you to the filtered context of this message (if it's different from the current context. It's not visible if the context is the same).
* Any tags that aren't in the current context appear above the message preceded by a `+` sign. You can click on them to go to that context.

### Channels

If you know of multiple instances/servers of the Filters software running you can listen to all of them just by adding the urls to the external channel box in your settings (see the bit about decentralisation above for more info). You can additionally authenticate to get private messages and more by typing in access tokens from one site to the other on the settings page.

### Formatting messages

URLS will be turned into links automatically, hashtags and mentions (`#tag @username`) will be turned into filter links. Basic image uploading is also supported (alt text and more coming soon).

Messages are formatted using the [typogr](https://www.npmjs.com/package/typogr) typographical library so punctuation is curled and improved.

## Author's reasons for making this

### 1) Context and control over what's on your feed

I love Twitter, everyone keeps wanting to replace it but I still love it. One thing that annoys me though is that sometimes the lack of a context behind a feed makes it seem like everyone's just shouting over each other about things. I mostly tweet about music but, in a year of a lot of big political events and other things, my tweets about music seem a bit funny next to everything else. I've even seen people get annoyed with others about tweeting something irrelevant to what they want to hear about.

I grew up on message boards (mostly music ones) and chat rooms (games). Both had closed contexts and communities where you could discuss one thing without being distracted or pushed into discussing other things.

Filters' messages are all tagged and you can add context to a stream and shift within contexts to filter out anything (or anyone). 

Additional filters for things such as who wrote a post, who upvoted/downvoted it or how many points it has (all filters can also be negated and combined) allow you to have full control over what you see. You can also share or bookmark these contexts as all they are is simple to write out urls.

### 2) Decentralisation

Storing all messages on one company's servers means you're forced to follow whatever advertising, privacy and content policies that company puts forward. Filters is decentralised. Any instance can listen to messages from any other instance (go into your personal preferences and type some urls in for channels you want to read, if they're hosting Filters instances the messages will be pulled into your feed and filtered just like the other messages). This allows you to create copies of the same software (it's free and open source) that support different features or look different but still understand messages from other instances.

## Developer instructions

Filters is built using Node.js. It uses the NedB JavaScript database but has a database API so you can slot in other databases if you want.

## Deploying Filters yourself

* Git clone or download this.
* Run `npm install`
* Run `node start.js`

### The config file

Put in a file called `config.json` and in it (JSON format) put the following options if you want to configure your filters instance:

* port - which port should filters run on?
* secret - a secret key used for signing cookies, if you don't specify this a random one will be created on startup but that means your sessions won't be persistent between server restarts.
* pageSize - how many messages to show in one page.
* database - the name of a JavaScript file to handle database queries/storage. Look at nedb.js for example functions.

## JSON feed of messages

Add `?format=json` to a Filters url to get messages in JSON format. If you pass a `code` parameter in (you can get this from your settings screen once logged in) you can make REST calls while logged in.

## Help!

Filters is free and open source and I would very much like your help. Whether it's suggestions, code or design, everything would be very much appreciated.

The code is still being tidied up after the initial get-all-the-features-in so if you want to make improvements to anything please do so and put in a pull request so they can be merged in. Or just say what's awful in an issue. 

Thank you!

## License

Filters is released under the ISC license.

## Credits

### Icons (via Noun Project)

* Reply icon by Jan-Christoph Borchardt
* Filter icon by Ismael Ruiz
* Picture icon by Suavis
* Lock icon by Edward Boatman
