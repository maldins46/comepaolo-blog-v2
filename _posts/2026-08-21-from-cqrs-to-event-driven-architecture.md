---
title: "From CQRS to Event-Driven Architecture: the five steps, and where to stop"
date: 2026-08-21
excerpt: "A REST endpoint that timed out because something three hops away was slow. That is how I ended up reading about CQRS, Event Sourcing, Asynchronous Request-Reply and Event-Driven Architecture."
tags: [architecture, cqrs, event-sourcing, eda, backend]
image: /assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/cover-image.jpg
featured: true
---

It all started with the same suggestion arriving from two different directions.

Summer 2024, the first one; I was working with my previous company on a platform for portfolio monitoring. The Spring Boot backend exposed multiple endpoints queried by the frontend, with a REST API in place for that. Some of these API calls became quite complex, for different reasons. Behind one of these single HTTP connections the server validated, wrote to a database, called two external services, and only then answered. When one of those services had a bad afternoon, the user got a `500`. Not because their request was wrong, but because something three hops away was slow.

A colleague I trust gave me advice on that, on more than one occasion: **separate the request from its execution, let events carry the work across, and go read about CQRS**. I tried to explore that and other patterns here and there, but I never put proper time into it.

Spring 2026, the second one; in a brainstorming session, my manager suggested CQRS and Event Sourcing for an application we were designing, this time for a completely different reason: **audit logs out of the box, no separate history table to maintain**.

The same words, for two problems that had nothing to do with each other; that was enough to send me reading properly. So take my hand, and let's walk through that journey together.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/get-deep.jpg" alt="Let's get deep on this together :)">
  <figcaption>Let's get deep on this together :)</figcaption>
</figure>

What I want to do here is connect a few tiles that were floating around separately in my head, and possibly in yours too: five patterns that keep coming up in the same conversations, what each one is really for, what it costs, and how they relate to one another. We start from a concrete need, that slow endpoint mentioned at first, and we end up somewhere far bigger than it.

These are the five ideas we'll go through:

1. **CQRS.** Split reads and writes into separate code paths.
2. **Event Sourcing.** Store facts instead of state.
3. **Asynchronous Request-Reply.** Accept the request, execute later.
4. **Transactional Outbox (+ Listen To Yourself).** One transaction for your state and your message.
5. **Event-Driven Architecture.** Publish the fact, let the rest of the company consume it.

To compare them fairly, every step gets pointed at the same example: an **order management system**, the back end of any online shop. A customer places an order, changes the delivery address ten minutes later, pays, and eventually the thing ships. A small domain, familiar to everybody, and with one property that becomes important later.

For every step I'll ask the same two things: what it fixes on that example, and what it charges in exchange. Plus a third one that mattered more to me at the time, which is whether it gets us any closer to fixing that endpoint.

---

## Step zero: The baseline architecture we all know

It's worth being precise about what we're comparing against, because it's tempting to turn it into an easy target, and it doesn't deserve that. The classic MVC layered application has four properties, and they travel together:

- Reads and writes go through the **same stack**: same endpoint, same service, same DAO.
- They use the **same model**. One `Order` class that is the business model, the persistence model, and (with a DTO or two of polish) the thing you send over the wire.
- It's **one deployment unit**, usually against **one data store**.
- Writes **mutate state in place**. You update a row, the old value is gone.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/01-layered.png" alt="The classic layered stack: client, endpoint, business service, DAO and database, each layer holding its own shape of the same Order">
  <figcaption>One path, and the same Order re-shaped four times along it</figcaption>
</figure>

This usually works. I want to say it clearly, because everything after this section is about alternatives and it would be easy to read the whole thing as a condemnation. Plenty of applications run on exactly this for years, and the people maintaining them sleep fine.

But there are cracks, and each one is the reason for one of the five steps:

1. **The data model is a compromise.** One schema serves both writing *and* reading. The form of that schema is usually write-optimized, meaning that we often end up using some tricks to obtain read-optimized views on top of it (ex., using database views). We hide a conflict of interest.
2. **You can't scale reads and writes independently.** If your traffic is 90% reads, read replicas solve that today, cheaply, with no architectural change whatsoever, giving you *more of the same shape*. But if the shape itself is the problem, more copies of it don't help, and you have to rewrite the whole stack.
3. **There's no history.** No snapshot, no replay, no rollback, no audit trail. Not because it's impossible, but because *you have to write that code yourself*, as a feature.
4. **It pulls toward a monolith.** Nothing forbids splitting it, but the pull of "one model, one store, one deploy" is real.

So, what should we do when these cracks start to look more like reefs?

---

## Step one: CQRS, and why it is much smaller than you think

Let's start with the definition. CQRS is an architectural pattern, and stands for Command Query Responsibility Segregation. **Commands** are write operations, **queries** are read operations, and the claim is simply that the two don't have to share a model. The idea behind the pattern is simple: one code path handles writes, shaped around the business rules it has to enforce. Another handles reads, shaped around the questions the UI actually asks. They can share a database. They just stop sharing a *model*.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/02-cqrs.png" alt="Plain CQRS: an order command service with a rich write model and an order query service with a flat read model, both against the same database">
  <figcaption>The split is in the code, not in the infrastructure</figcaption>
</figure>

This alone addresses the data modelling compromise crack mentioned before. Your write model can be a rich domain object with all its rules, your read model can be a flat denormalised thing that answers "every unshipped order from this week, most valuable first" in one query, and neither compromises for the other.

The benefit is particularly felt in high-performance applications. Since read and write "stacks" are now separated, they can now grow and *scale* independently. You can go from naive approaches, like having denormalized schema on reads to reduce the need of join oprations, to advenced approaches that involve even using **multiple** data stores. Which means, storing models in different databases, or with even different technologies (ex., using a Redis cache for read operations, with faster data access). 

On the other side, keep in mind that like any pattern, CQRS is useful in some places, but not in others. Many systems do fit a CRUD mental model, and so should be done in that style. CQRS is a significant mental leap for all concerned, so shouldn't be tackled unless the benefit is worth the jump. It could (and should) only be used on specific portions of a system (a BoundedContext in DDD) and not the system as a whole.

---

## Step two: event sourcing, and the state you never stored

Event Sourcing answers a different question altogether: *what do we store?*

Worth saying once before going into the details, since it confused me for weeks: **CQRS and Event Sourcing are two separate patterns**, and the dependency runs one way only. Event sourcing effectively forces CQRS on you (for reasons we'll get to). Most articles present them as one package.

So let's get back to that; **Event Sourcing** is an architectural design pattern, based on a simple concept: determine *application state from a sequence of events*. Not rows holding current values, but the ordered list of everything that ever happened. Instead of a row that says `status = SHIPPED`, you store `OrderPlaced`, then `OrderDeliveryAddressChanged`, then `OrderShipped`. Current state isn't stored at all: you get it by replaying the list.

My first reaction was suspicion, and I don't think that's unusual. But then you start noticing how many domains are *already* shaped like this. A package moving through a logistics network is a sequence of events. A version control repository is a sequence of commits, and Git reconstructs your working tree by replaying them. Your relational database's own write-ahead log works on the same principle, quietly, underneath the very system you were about to call "the normal way".

The reason to want this is that **the history stops being something you have to build as a feature**. If somebody in your domain regularly asks "who changed this, when, and what did it look like before?", event sourcing answers it for free, and a classic architecture answers it with a hand-written audit table that is always slightly out of date. That's why it shows up in payments, insurance, betting and logistics, where the past is not a nice extra but the thing being regulated. And if nobody in your domain ever asks about the past, you're paying for a feature nobody uses.

Two rules come with that definition. An **event is something that happened, never something that should happen**: that one is a **command**, and commands can be rejected, while events can't be. So you write them in the past tense, `OrderPlaced` and not `PlaceOrder`, using the vocabulary of the domain rather than of the database. And you **never delete them**: removing something is itself an event appended to the stream, because the deletion is a fact like any other (with some exceptions, like GDPR; but let's skirt around that, since we risk going off-topic).

There aren't many moving parts: the **application** produces events, an **event queue** (usually represented by a message broker) carries them, **event handlers** react to them, doing the actual business logic, and the **event store** keeps them durably. The ordered sequence flowing through all of it is the **event stream**.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/03-event-sourcing.png" alt="Event sourcing building blocks: the application, an event queue carrying the order events, event handlers, and the append-only event store">
  <figcaption>The application appends facts, handlers react, the store keeps everything forever</figcaption>
</figure>

### Why the two patterns end up together

Storing facts instead of state raises an obvious question. How do you query any of this?

It's often said that event stores have terrible query performance, and that's not quite right. An event store is excellent at the one question it exists to answer: "give me every event for aggregate 42, in order". That's an indexed range scan, and it's fast. What it cannot do is answer *any* question. "Every unshipped order from this week, most valuable first" spans thousands of streams, and no index makes replaying all of them viable.

So the solution here is to build the answer in advance. An event handler subscribes to the stream and **projects** it into a read model shaped like the question, and if you can build one projection (or *snapshot*) you can build several: one for the dashboard, one for the search box, another one holding last week's state if somebody asks for it. The application queries those, never the raw log.

And that is CQRS, reached by necessity rather than by choice. Once your source of truth is an event stream, a separate read model isn't an option you evaluate, it's the only way to serve a query at all. This is why the two are almost always taught as one thing: the expensive pattern cannot work without the cheap one, so anybody explaining event sourcing has to explain CQRS on the way. What gets lost is that the reverse isn't true.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/04-es-cqrs.png" alt="Event-sourced CQRS: the order command service publishes to an event queue, which feeds the append-only event store and a projection handler, and the handler projects the stream into read models the order query service reads">
  <figcaption>The same split as before, with considerably more machinery</figcaption>
</figure>

What you buy with all that machinery is the missing history crack, closed completely. You can rebuild any state at any time, which means "what did this look like on the 3rd of March?" stops being a research project. Another interesting consequence regards also *debugging*: if a user hits a bug that only shows up after a specific sequence of operations, you replay their exact stream into a test environment and watch it happen, instead of guessing.

### The reality check

At this point I had a decent map and no idea whether anyone actually lived there. So I went looking for people who had actually built these systems, rather than people explaining them, and the picture is clearly divided.

It pays off in some places. The creator of Axon Framework (a, probably "the", state-of-the-art framework that allows to apply CQRS + Event Sourcing in Java), in [a thread about real-world adoption](https://www.reddit.com/r/java/comments/6znmfi/anyone_using_axon_or_cqrs_event_sourcing_in_real), lists banks running core payment systems on it, airport management systems processing radar data, and the betting industry, *"because of the strict auditing requirements and high value of past events."* Someone rebuilding tracking for a large logistics firm put it more sharply: the traditional model, *"CRUD, locks, relational DB, is the one that ADDS a lot of complexity here, not the event sourcing stack we chose."* That's the strongest case for the pattern. Not that it's powerful, but that in the right domain it's *simpler than the alternative*.

And it could be a disaster in others. A team processing 40,000 IoT messages a second, exactly the "high throughput" territory you'd expect to be a good fit, tried it and scrapped it: it *"adds massive amounts of complexity, and what would be a simple problem to solve in standard architecture becomes a whole sprint for your team."* Their conclusion was to stick with a traditional architecture until it can't cut it, then refactor, rather than choosing it from the start.

So the thing that decides isn't throughput, it's whether the *domain* really is a sequence of facts that somebody needs to audit. High volume on its own buys you nothing here. It just makes the overhead more expensive.

My take, after all that reading: full event sourcing across a whole domain is right for a narrow slice of systems, and for most applications adopting it wholesale costs more than it gives back.

The *ideas* underneath were still right, though, even where the full pattern was wrong. Separate the intent from the execution, write down what the user asked for before you do it, treat a request as a durable fact instead of an open connection. All of that seemed valuable at a much smaller scale, in one endpoint or one module. Which left me with a question I felt slightly stupid asking: does the small version have a name, or was I just describing a queue with extra steps?

---

## Step three, Asynchronous Request-Reply: the same idea, one endpoint wide

It does have a name: **Asynchronous Request-Reply**, and it's about the *interaction* between client and server.

A client sends a request whose processing is slow, or depends on downstream systems you don't control. The classic answer is to hold the HTTP connection open and hope. The pattern's answer is to stop doing that. The server accepts the request, returns `202 Accepted` immediately with an identifier (a job ID), and the client either polls that identifier on a status endpoint, or gets notified later via webhook or WebSocket. When the work is completed, the status endpoint will return an HTTP `302 (Found)` response with a resource URL that the client can be redirected to.

Underneath, the incoming request becomes an explicit **command** object, something like `ProcessPaymentCommand`, and goes on a queue. Background workers pull commands off and execute them.

Roughly:

```
on POST /orders (request):
    validate request shape          # cheap, structural only
    command = PlaceOrderCommand(payload=request, status=PENDING)
    persist(command)                # the only durable write here
    return 202 Accepted, { id: command.id }

worker loop:
    command = claim_next(status=PENDING)   # atomically, so two workers can't take it
    if none: sleep; continue

    try:
        execute_business_logic(command)     # the slow, fragile part
        mark(command, DONE)
    catch transient_failure:
        mark(command, PENDING, attempts += 1, next_attempt_at = now + backoff)
    catch permanent_failure as e:
        mark(command, FAILED, reason = e)
```

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/07-async-request-reply.png" alt="Asynchronous Request-Reply: the client posts an order, the API persists a PENDING job and answers 202 with a jobId, a worker claims and creates the order, and the client polls a status endpoint that eventually answers 302 with the order url">
  <figcaption>Accept now, execute later, let the client come back for the result</figcaption>
</figure>

Now look at what it buys.

**Retries come for free**, because the failure branch isn't error handling bolted on afterwards, it's the same state machine as the success branch. When the external API is down, the command sits in `PENDING` and gets tried again later. Your user doesn't get a `500` for something that was never their fault.

**You also get load smoothing**. Traffic spike, flash sale, whatever: the API's job is now to write a row, which it does very fast. Ingestion runs at spike speed, execution runs at whatever pace your workers can sustain, and the queue absorbs the difference between the two.

And almost by accident **you end up with an audit trail of intent**. That stored command is a record of *what the user wanted*, so if a bug corrupts your final state, you still have the original request sitting there and you can replay it. It feels like an event sourcing benefit, and it came from a single table.

And now the cost, because this step is cheap but not free. **Your client needs somewhere to collect the result**, which means polling endpoints or webhook delivery, infrastructure you didn't have before. And the awkward one: **business errors now surface *after* you've answered `202`**. You can no longer tell the user "your card was declined" in the response to their own request. That has to travel back through a notification, an email, or a status endpoint, and designing that path properly is usually more work than the worker loop itself. Anything the user must know immediately has to stay in the synchronous validation step, which puts real pressure on where you draw that line.

Still, this is the shape I was searching for from the start, and the one my colleague had been describing all along: intent separated from execution, at exactly one boundary, with no framework and no event store behind it. **One table and a loop**. This article could stop here, but since we are engineers, we noticed that something else can be improved. Let's get deeper into the rabbit hole.

---

## Step four: the dual write, and the Transactional Outbox

Step three left the worker doing its job against a single database, which is a comfortable place to be: one database means transactions. Now give that worker the one extra responsibility every real system eventually needs. Once it has saved the order, it also has to tell somebody else, so it publishes a message to a broker.

That's two writes, to two different systems, with no transaction covering both, and it has a name: the **dual-write problem**. The database transaction can commit while the publish fails, and you get an order that nobody downstream ever hears about. Or the publish succeeds and the transaction rolls back, and the rest of the company reacts to an order that doesn't exist. You can wrap the database write in a transaction. You cannot enrol the broker in it. So the two can disagree, and when they do, nothing tells you.

The usual mitigations, retries and try/catch and publishing only after the commit, all narrow the window without closing it. The process can die *inside* the window. There is no arrangement of two independent writes that is atomic. The only real fix is to stop having two writes.

Meet the **Transactional Outbox** pattern: instead of publishing to the broker, insert the message into an `outbox` table **in the same database transaction** as your business data. Then a separate process called a **relay** reads the outbox and publishes onward.

```
on handling a command, inside ONE transaction:
    save(order)                                  # business state
    insert(outbox, OrderPlaced(order.id, ...))   # the message, same transaction
    commit                                       # both, or neither

relay process (separate, runs continuously):
    for row in outbox where not published:
        publish(broker, row.payload)
        mark(row, published)                     # at-least-once: consumers must be idempotent
```

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/05-outbox.png" alt="The transactional outbox: the ORDERS and OUTBOX tables written inside a single database transaction, with a relay reading the outbox and publishing to the broker">
  <figcaption>Business data and message in one commit, or neither</figcaption>
</figure>

The relay itself can be boring. In the Spring world could be a `@Scheduled` job that reads the unpublished rows and hands them to a message broker, like Kafka.

Now look at that relay loop again, because it doesn't fully escape the problem either. It publishes, then it marks the row as published, and those two steps aren't atomic: a crash in between sends the same message twice. The outbox hasn't deleted the risk, it has *moved* it, from "the message might be lost" to "the message might arrive twice". That trade is the point of the exercise, because **a lost message is unrecoverable while a duplicated one is an engineering problem with known solutions**.

That's called **at-least-once** delivery: every message arrives, some arrive more than once, and the responsibility shifts to whoever receives them. Those **receivers have to be idempotent**, meaning that handling the same message twice leaves the system in the same state as handling it once. In practice that's an identifier carried in the message (the order ID is usually sitting right there) plus a uniqueness constraint or a "have I already processed this one?" check that turns the second attempt into a no-op. Once messages are moving between systems, idempotency stops being a detail and becomes a house rule.

### Step four and a half: joining the dots

It's worth stopping here to look at a small variation on the outbox, because this is where everything links back to the earlier steps.

**Listen To Yourself** is a variation on the Transactional Outbox where you simply invert the order. Instead of writing your state and an outbox row together, you publish the event to the broker *first*, and then let your own service consume its own event and update its local state from it. There is only one write, so there is nothing left to disagree with, and the broker becomes the source of truth.

Sound familiar? **It's basically step three, Asynchronous Request-Reply, implemented with events instead of a command table**. The endpoint accepts the request, publishes the fact, answers `202`, and the real work happens later when your own consumer picks the event up. Same separation between intent and execution, different transport. The price is the one from step two: your own state is now eventually consistent with the event you have just published, so anything reading immediately afterwards can still see the previous value, and you have to decide whether your domain tolerates that.

**Event Sourcing** closes the circle from the other side. If the event you publish is also the event you store, then **the outbox table and the event store stop being two different things**. There is no second write to disagree with, because the write *is* the event. The dual-write problem doesn't get solved so much as it stops existing, and that was part of what step two had been selling all along.

---

## Step five: zoom out, and it's Event-Driven Architecture

The last step doesn't need any new machinery, only a change of scope.

Everything so far has been inside one application. The outbox row was published to a broker so *your own* background worker could pick it up. Now stop thinking about your service and think about the whole company.

That same `OrderPlaced` event, published to a shared enterprise broker like Kafka, isn't just yours anymore. Billing consumes it to issue an invoice. Inventory consumes it to decrement stock. Shipping consumes it to create a label. Analytics consumes it because analytics consumes everything.

None of those services called your API. You didn't call theirs. You don't know they exist, and, this is the important part, you don't have to change your code when a fourth one shows up next quarter. You published a fact, and whoever cares about it, cares.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/06-eda.png" alt="Event-driven architecture: the order service relay publishes OrderPlaced to a Kafka topic, consumed by billing, inventory, shipping and analytics, each with its own database">
  <figcaption>The outbox pattern, with a wider audience</figcaption>
</figure>

That's **Event-Driven Architecture**, and it's just the outbox pattern with a wider audience.

That also changes what the outbox is for; it's the safety mechanism that lets you adopt EDA without losing data. Without it, every service publishing to the shared broker has an unguarded dual write, and your beautifully decoupled architecture is silently losing messages at every node.

On the other side, keep in mind that even that "globally decoupled" application comes with a cost. **You give up global ordering**, so events about the same entity can reach a consumer out of sequence. **You inherit at-least-once delivery organisation-wide**, so every consumer needs the idempotency we keep coming back to. **Debugging stops being a stack trace** and becomes a correlation ID chased across five services' logs. And the subtle one: your event schema becomes public API. A REST endpoint has known callers you can go and talk to. The coupling didn't disappear, it moved into the payload, where it's harder to see.

---

## What I actually took away

I set out to fill in a missing piece, and ended up tracing, accidentally and roughly backwards, the path the industry took to arrive at event-driven architecture. What a journey!

In hindsight, the first thing I can do is go back to those two suggestions and finally answer them.

To my manager: it's clear now what he meant. He was pointing at event sourcing as a way to get proper auditing of every change to the entity, for free. On that specific system, though, I still don't think it would have been the right fit. The audit trail would have been a real gain, but that domain was complex, and complex in the way that resists being modelled as a list of events.

To my colleague: it's clear now that he was pointing at asynchronous request-reply, or some variation of it. Here I partly agree. His suggestion was a general one, move the whole architecture in that direction, and that part I don't buy: it doesn't remove the complexity, it relocates it. The same code lives somewhere else, and the request that used to fail with a `500` now gets a `202` and fails later, out of sight.

I said *partly*, though, because there were a few contexts where a system like that made a lot of sense, and we built one without knowing the pattern had a name. The customer needed to submit a large batch of requests at once, each one potentially slow, and was fine with them being handled asynchronously. Perfect fit, and we ended up with asynchronous request-reply by accident.

What I concretely take away is to use these ideas *surgically*. Weigh the cost every time, and be happy to know one pattern more than you did last time. And these days, when somebody drops "we could use events here" into a brainstorming session, I at least know now which of the five things they're pointing at.

## Sources

- [CQRS and Event Sourcing](https://www.youtube.com/watch?v=A0goyZ9F4bg), Michael Ploed at SpringOne2GX 2015. The walkthrough I followed for steps one and two.
- [CQRS is not an Architecture](https://gregfyoung.wordpress.com/2012/09/09/cqrs-is-not-an-architecture), Greg Young, 2012.
- [CQRS](https://martinfowler.com/bliki/CQRS.html), Martin Fowler, 2011.
- [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html), Martin Fowler, 2017.
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html), Martin Fowler, 2005. The original write-up of the pattern.
- [Anyone using Axon or CQRS/event sourcing in real life?](https://www.reddit.com/r/java/comments/6znmfi/anyone_using_axon_or_cqrs_event_sourcing_in_real) Reddit thread with a comment from an Axon maintainer, quoted in the reality check chapter, 2017.
- [Asynchronous Request-Reply](https://learn.microsoft.com/en-us/azure/architecture/patterns/asynchronous-request-reply), Azure Architecture Center, 2026.
- [Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html), Chris Richardson, 2019.
- [Event-driven architecture style](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven), Azure Architecture Center, 2026.
- [A Spring Boot outbox implementation](https://github.com/ChintaHari/springboot-transactional-outbox-pattern), if you want to experiment with a working code example.
- The header image is [Webb Opens Treasure Chest](https://www.nasa.gov/image-article/webb-opens-treasure-chest), from NASA.
