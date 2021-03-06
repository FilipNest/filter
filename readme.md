# Filters

Social messaging/chat based around context, people and quality filters. Free and open source. Decentralised. Translatable. Themeable. Easy to deploy.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)


* [Quick start for users](#quick-start-for-users)
* [For developers](#developers)

<img src="https://cloud.githubusercontent.com/assets/4625324/22355151/f19f0ea0-e420-11e6-9cfc-82ba64baa05a.gif" alt="screen capture of filters searching for music in 2017 and kittens" width="300"/>

## About

Filters is a demo/concept/experiment of a decentralised social messaging platform with a focus on context. It's a bit like Twitter crossed with a chat room with the ability to have discussions on a specific topic with specific people while filtering out content you don't want based on topic, author, points (votes) the post has and more.

You can switch contexts easily by typing tags into a big context box at the top of the page but can also set default contexts and filters for yourself to only show content by specific users (or not by specific users) or content that has a certain amount of points throughout the whole system.

Have a play at [filters.social](https://filters.social) or deploy your own instance (instructions below) and add any thoughts to the issue queue here on GitHub. Feedback and contributions would be hugely appreciated.

The decentralised bit means you can run your own copy of it (it's free and open source) and communicate with other copies. 

_Developers can also play with a REST and websockets API and even switch database types through a database abstraction layer._

## Tags

### Automatically added tags

* The userid of the author
* A unique id for the message itself (always prefixed with `msg-`)
* Any tags from the current context (switch context if you want to write in a different one)

### Manually adding tags

Aside from changing the context in the context box, you can add extra tags by prefixing words with the `#` symbol. Mentions are pretty much the same prefixed with a `@` and are also added to the message's tags. Double `@@` is a private message.

## Points

Messages can be voted up or down (or both currently, not sure if bug/feature!). This is useful for filtering away good or bad content. One upvote and one downvote per user per message.

## Filters

* `!tag` negates the tag so makes sure it's not there.  `!world,hello` would show all things tagged with `hello` but not `world`.
* `minpoints=value` only shows posts with points greater or equal to the value field. So `minpoints=10` would only show posts with points greater or equal to 10.
* `author=userid` only shows posts by that author. So `author=FilipNest` would only show posts by a user with the id `FilipNest`.
* `upvoted=userid` and `downvoted=userid` return only posts that the specified userid has upvoted/downvoted.
* `@userid` is not really a special filter, it's just a tag specific to users.
* `@@userid` is like mentions but only users with that user id will be able to see the message. Private messaging.

All special filters can also be preceded by a `!` to negate the filter.

## Navigating through a message

* Author will lead you to a filter for them. All their messages will appear here. It's kinda like a profile page but there are no profile pages. Just discussion contexts.
* Reply button will add a filter for the message id and mention the author.
* Filter button will lead you to the filtered context of this message (if it's different from the current context. It's not visible if the context is the same).
* Any tags that aren't in the current context appear above the message preceded by a `+` sign. You can click on them to go to that context.

## Channels

If you know of multiple instances/servers of the Filters software running you can listen to all of them just by adding the urls to the external channel box in your settings. You can additionally authenticate to get private messages as well by typing in access tokens from one site to the other on the settings page.

## Formatting messages

URLS will be turned into links automatically, hashtags and mentions (`#tag @username`) will be turned into filter links. Basic image uploading is also supported (alt text and more coming soon).

Messages are formatted using the [typogr](https://www.npmjs.com/package/typogr) typographical library so punctuation is curled and improved.

## Author's reasons for making this

### 1) Context and control over what's on your feed

I love Twitter but the main thing that annoys me is that sometimes the lack of a context behind a feed makes it seem like everyone's just shouting over each other about things. I mostly tweet about music but, in a time of a lot of big political events, my tweets about music seem a bit funny next to everything else. I've even seen people get annoyed with others about tweeting something irrelevant to what they want to hear about.

I grew up on message boards (mostly music ones) and chat rooms (games). Both had closed contexts and communities where you could discuss one thing without being distracted or pushed into discussing other things.

Filters' messages are all tagged and you can add context to a stream and shift within contexts to filter out anything (or anyone). 

Additional filters for things such as who wrote a post, who upvoted/downvoted it or how many points it has (all filters can also be negated and combined) allow you to have full control over what you see. You can also share or bookmark these contexts as all they are is simple to write out urls.

### 2) Decentralisation

Storing all messages on one company's servers means you're forced to follow whatever advertising, privacy and content policies that company puts forward. Filters is decentralised. Any instance can listen to messages from any other instance (go into your channels preferences and type some urls in for channels you want to read, if they're hosting Filters instances the messages will be pulled into your feed and filtered just like the other messages). This also allows you to create copies of the same software that support different features or look different but still understand messages from other instances.

## Quick start for users

* [filters.social](https://filters.social)
* Register for an account (you can read posts without)
* Put in tags in the top box to switch contexts.
* Messages automatically get tagged with the context they're in. Plus things like author and a message id for replies.
* You can use special filters like `author=` to filter down further. There's a big button to help you with all of these (and they're listed below).
* All filters/tags can be reversed/negated with an exclamation point `!author=filipnest` or `!poetry`.
* You can vote on posts. And filter based on who's voted on them using `upvoted=username` and `downvoted=username` filters. Or only show posts that have a certain number of votes with the `minpoints=` filter.
* `#hashtags` work within messages (the same as switching/adding contexts). As do `@mentions`. `@@username` is a private message.
* You can set global filters for your username to filter out stuff regardless of current context.
* You can listen to other instances of filters (that's the decentralised part).

## Developers

### Deploying

#### As a global NPM module

* Run `npm install -g filters.social`
* Navigate to a directory you want to store stuff like message data and files in.
* Run `filters` + optional config parameters

#### From git/files

* Clone or download this via git or otherwise
* Run `npm install` in the root directory to install dependencies
* Run `npm start` + optional config parameters

### Config settings

Launching filters without any config parameters will run a server on port 80 and put files and data in an automatically created `/data` directory. You can pass a `config` argument to point to a JSON file with settings for example `npm start config=myconfig.json` or pass these parameters in directly as arguments.

All of these options are optional/have defaults

* port - which port should filters run on?
* secret - a secret key used for signing cookies, if you don't specify this a random one will be created on startup but that means your sessions won't be persistent between server restarts.
* pageSize - how many messages to show in one page.
* database - the name of a JavaScript file to handle database queries/storage if you don't want to use the default. Look at `db_nedb.js` for example functions as that's the default file.
* fileSize - Max file upload size in bytes
* data - Directory where the database and files will be stored

### Database

Filters uses the NedB JavaScript database but has a database API so you can slot in other databases if you want. Look at the `db_nedb.js` for all the functions that uses and then put your new file in the config `database` parameter.

### Translations

There's a basic locales directory with the English text at the moment. All the text strings should be in there. If you understand another language and would want to contribute pull requests with translations that would be amazing.

### JSON feed of messages

Add `?format=json` to a Filters url to get messages in JSON format. If you pass a `code` parameter in (you can get this from your settings screen once logged in) you can make REST calls while logged in.

For example: https://filters.social/kittens?format=json

## Help!

Filters is free and open source and I would very much like your help. Whether it's suggestions, code or design, everything would be very much appreciated.

The code is still being tidied up after the initial get-all-the-features-in so if you want to make improvements to anything please do so and put in a pull request so they can be merged in. Or just say what's awful in an issue. 

Thank you!

## License

Filters is released under the ISC license. This shouldn't be restrictive in any way but if you want me to release it under another license just let me now in the issue queue and I'll probably be able to fork it for you.

## Credits

### Font

The main font used by Filters is [Fira Sans](https://github.com/mozilla/Fira).

### Libraries

See `package.json` file for libraries used. Additionally using a fork of [jQuery Tags Input](https://github.com/xoxco/jQuery-Tags-Input). 

### Icons (via Noun Project)

* Reply icon by Jan-Christoph Borchardt
* Filter icon by Ismael Ruiz
* Picture icon by Suavis
* Lock icon by Edward Boatman
