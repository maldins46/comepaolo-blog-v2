---
title: "From CQRS to Event-Driven Architecture: the five steps, and where to stop"
date: 2026-08-21
excerpt: "A REST endpoint that timed out because something three hops away was slow. That is how I ended up reading about CQRS, Event Sourcing, Asynchronous Request-Reply and Event-Driven Architecture."
tags: [architecture, cqrs, event-sourcing, eda, backend]
image: /assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/cover-image.jpg
featured: true
---

It started with the same suggestion arriving from two different directions.

The first came from a colleague I trust, and it was aimed at a problem I already had: a REST endpoint that did too much. A client called it, and behind that single HTTP connection the server validated, wrote to a database, called two external services, and only then answered. When one of those services had a bad afternoon, my user got a `500`. Not because their request was wrong, but because something three hops away was slow. My colleague's advice, repeated more than once, was to separate the request from its execution, let events carry the work across, and go read about CQRS.

The second came a while later, in a brainstorming session, when my manager suggested CQRS and event sourcing for an application we were designing, this time for a completely different reason: audit logs out of the box, every change recorded, nothing overwritten, no separate history table to maintain. Hold on to that reason, because it comes back at the end of the article.

Two people I respect, pointing at the same words for two problems that had nothing in common. That was enough to make me curious, and curious enough to go and look properly. I knew the shape of the fix I wanted for my endpoint, *take the request, write it down, say "got it", do the work later*, but I didn't know its name.

**So take my hand, and let's walk through that investigation together.** What I want to do here is connect a few tiles that were floating around separately in my head, and possibly in yours too: five patterns that keep coming up in the same conversations, what each one is really for, what it costs, and how they relate to one another. We start from a concrete need, that slow endpoint, and we end up somewhere far bigger than it. I'll spoil the ending now: most of the time what you need is much smaller than the premise.

These are the five ideas we'll go through:

1. **CQRS.** Split reads and writes into separate code paths. Cheap. Requires no events at all.
2. **Event sourcing.** Store facts instead of state. Expensive. Effectively forces CQRS on you.
3. **Asynchronous request-reply.** Accept the request, return `202`, execute later.
4. **Transactional outbox + Listen To Yourself.** One transaction for your state and your message, so neither can go missing.
5. **Event-driven architecture.** Publish the fact, let the rest of the company consume it.

To compare them fairly, we'll often refer to the same example: an **incident management system**, borrowed from [Michael Ploed's SpringOne2GX talk](https://www.youtube.com/watch?v=A0goyZ9F4bg), the clearest walkthrough of this material I found while reading. Somebody reports that the printer on floor two is on fire, the report gets an ID and a description, a colleague corrects that description with the details that were missing, somebody takes the incident, somebody resolves it. A small domain, familiar to anybody who has worked in a team with an on-call rotation, and with one property that becomes important later: what happened, and in which order, matters as much as the state the incident is in right now.

For every step the questions are the same. What does it fix on that example, what does it charge for the fix, and does it bring us any closer to the endpoint we started from.

Let's go through them, one at a time.

## Step zero: The architecture we all know (and why it's fine)

It's worth being precise about what we're comparing against, because it's easy to turn it into an easy target, and it doesn't deserve that. The classic layered application has four properties, and they travel together:

- Reads and writes go through the **same stack**: same endpoint, same service, same DAO.
- They use the **same model**. One `Incident` class that is the business model, the persistence model, and (with a DTO or two of polish) the thing you send over the wire.
- It's **one deployment unit**, usually against **one data store**.
- Writes **mutate state in place**. You update a row, the old value is gone.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/01-layered.png" alt="The classic layered stack: client, endpoint, business service, DAO and database, each layer holding its own shape of the same Incident">
  <figcaption>One path, and the same Incident re-shaped four times along it</figcaption>
</figure>

This works, and I want to say that clearly, because the rest of the article is about alternatives and it would be easy to read as a condemnation. It isn't. A huge number of applications run smoothly on exactly this, for years, and the people maintaining them sleep well.

But there are cracks, and each one is the reason for one of the five steps:

1. **The data model is a compromise.** One schema serves writing *and* every shape of reading. That's why we end up with a pile of database views: we're extracting read-optimised shapes from a write-optimised store, hiding a conflict of interest.
2. **You can't scale reads and writes independently.** This crack is real, but exaggerated, and I'd rather say so than repeat it uncritically. If your traffic is 90% reads, read replicas solve that today, cheaply, with no architectural change whatsoever. The honest version of this complaint is narrower: replicas give you *more of the same shape*, and if the shape itself is the problem, more copies of it don't help.
3. **There's no history.** No snapshot, no replay, no rollback, no audit trail. Not because it's impossible, but because *you have to write that code yourself*, every time, as a feature.
4. **It pulls toward a monolith.** Nothing forbids splitting it, but the pull of "one model, one store, one deploy" is real.

Cracks #1 and #3 are the ones that open doors, and they open different ones. That distinction is the next section.

## Step one: CQRS is much smaller than you think

Let's start with the definition, because the name is far heavier than the idea. CQRS stands for Command Query Responsibility Segregation. **Commands** are write operations, **queries** are read operations, and the whole claim is that the two don't have to share a model. One code path handles writes, shaped around the business rules it has to enforce. Another handles reads, shaped around the questions the UI actually asks. They can share a database, even a schema. They just stop sharing a *model*.

That's it. A small pattern, on the scale of a couple of objects inside one component, with no broker and no event store anywhere in sight.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/02-cqrs.png" alt="Plain CQRS: a command service with a rich write model and a query service with a flat read model, both against the same database">
  <figcaption>The split is in the code, not in the infrastructure</figcaption>
</figure>

This alone addresses crack #1. Your write model can be a rich domain object with all its rules, your read model can be a flat denormalised thing that answers "all open incidents assigned to Marco, sorted by priority" in one query, and neither compromises for the other. No broker, no event store, no eventual consistency, no new operational work.

Worth saying once, since it confused me for weeks: CQRS and event sourcing are two separate patterns, and the dependency runs one way only. Event sourcing effectively forces CQRS on you, for reasons we'll get to. CQRS needs nothing from event sourcing at all. Greg Young, who coined the term, has been repeating this for years, in a post titled [*CQRS is not an Architecture*](https://gregfyoung.wordpress.com/2012/09/09/cqrs-is-not-an-architecture/). Almost every article presents them as one package, and I read them that way, which is why the cheap idea looked to me like it carried the expensive idea's price tag.

If you take one thing from this article: **this step is available to you right now, in any codebase, at nearly zero cost, and it is not what people mean when they warn you that CQRS is overengineering.** What they're warning you about is the next step.

## Step two: event sourcing, and the state you never stored

This is a genuinely different answer to a different question: *what do we store?*

**Event sourcing** determines application state from a sequence of events. Not rows holding current values, but the ordered list of everything that ever happened. Instead of a row that says `balance = 100`, you store `Deposited(+50)`, `Deposited(+100)`, `Withdrawn(-50)`. Current state isn't stored at all: you get it by replaying the list.

The first reaction is usually suspicion. Mine was. But notice how many domains are *already* shaped like this. A package moving through a logistics network is a sequence of events. A version control repository is a sequence of commits, and `git` reconstructs your working tree by replaying them. Your relational database's own write-ahead log works on the same principle, quietly, underneath the very system you were about to call "the normal way".

The reason to want this is that the history stops being something you have to build as a feature. If somebody in your domain regularly asks "who changed this, when, and what did it look like before?", event sourcing answers it for free, and a classic architecture answers it with a hand written audit table that is always slightly out of date. That's why it shows up in payments, insurance, betting and logistics, where the past is not a nice extra but the thing being regulated. The flip side is just as blunt: if nobody ever asks about the past, you're paying for a feature you don't use.

Two rules come with that definition. An event is something that **happened**, never something that *should* happen: that one is a **command**, and commands can be rejected, while events can't be. So you write them in the past tense, `OrderPlaced` and not `PlaceOrder`, using the vocabulary of the domain rather than of the database. And you never delete them: removing something is itself an event appended to the stream, because the deletion is a fact like any other.

There aren't many moving parts: the **application** produces events, an **event queue** carries them (in practice a message broker), **event handlers** react to them, and the **event store** keeps them durably, forever. The ordered sequence flowing through is the **event stream**.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/03-event-sourcing.png" alt="Event sourcing building blocks: the application, an event queue carrying the incident events, event handlers, and the append-only event store">
  <figcaption>The application appends facts, handlers react, the store keeps everything forever</figcaption>
</figure>

Three familiar things also behave differently once state is derived rather than stored.

### A worked example

Back to the incident example now. A user submits an incident, someone corrects its description, someone resolves it.

In the classic architecture, that's an `INSERT` and two `UPDATE`s, leaving one row in its final state. The description the user *originally* wrote is gone. When it changed, and to what, is gone.

In an event-sourced system, that's three events, appended:

```
IncidentReported(id=42, text="printer on fire", reportedBy=riccardo)
IncidentTextChanged(id=42, text="printer on fire, floor 2, smoke visible")
IncidentResolved(id=42, resolvedBy=marco, resolution="replaced fuser unit")
```

Nothing was overwritten. Current state is what you get by replaying those three in order, and so is the state *as of yesterday*, if you replay only the events up to yesterday.

### Why the two patterns end up together

Storing facts instead of state raises an immediate question: how do you query any of this?

It's often said that event stores have terrible query performance, and that's not quite right. An event store is excellent at the one question it exists to answer: give me every event for aggregate 42, in order. That's an indexed range scan, and it's fast. What it cannot do is answer *your* question. "All open incidents assigned to Marco, sorted by priority" spans thousands of streams, and no index makes replaying all of them viable.

So you build the answer in advance. An event handler subscribes to the stream and **projects** it into a read model shaped like the question, and if you can build one projection you can build several: one for the dashboard, one for the search box, one holding last week's state. The application queries those, never the raw log.

And that is CQRS, reached by necessity rather than by choice. Once your source of truth is an event stream, a separate read model isn't an option you evaluate, it's the only way to serve a query at all. **This is why the two are almost always taught as one thing:** the expensive pattern cannot work without the cheap one, so anybody explaining event sourcing has to explain CQRS on the way. What gets lost is that the reverse isn't true.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/04-es-cqrs.png" alt="Event-sourced CQRS: the command service appends to the event store, snapshots are taken every N events, an event handler projects the stream into read models, and the query service reads those">
  <figcaption>The same split as before, with considerably more machinery</figcaption>
</figure>

What you buy for all that machinery is crack #3, closed completely. Rebuilding any state at any time. Temporal queries, so "what did this look like on the 3rd of March?" stops being a research project. And replay for debugging: a user hits a bug that only appears after a specific sequence of operations, and you replay their exact stream into a test environment and watch it happen.

## The reality check

At this point I had a decent map and no idea whether anyone actually lived there. So I went looking for people who had actually built these systems, rather than people explaining them, and the picture is clearly divided.

**It pays off in some places.** The creator of Axon Framework, in [a thread about real-world adoption](https://www.reddit.com/r/java/comments/6znmfi/anyone_using_axon_or_cqrs_event_sourcing_in_real/), lists banks running core payment systems on it, airport management systems processing radar data, and the betting industry, *"because of the strict auditing requirements and high value of past events."* Someone rebuilding tracking for a large logistics firm put it more sharply: the traditional model, *"CRUD, locks, relational DB, is the one that ADDS a lot of complexity here, not the event sourcing stack we chose."* That's the strongest case for the pattern. Not that it's powerful, but that in the right domain it's *simpler than the alternative*.

**And it's a disaster in others.** A team processing 40,000 IoT messages a second, exactly the "high throughput" territory you'd expect to be a good fit, tried it and scrapped it: it *"adds massive amounts of complexity, and what would be a simple problem to solve in standard architecture becomes a whole sprint for your team."* Their conclusion was to stick with a traditional architecture until it can't cut it, then refactor, rather than choosing it from the start.

So the discriminator isn't throughput. It's whether the *domain* really is a sequence of facts, and whether somebody needs to audit it. High volume alone buys you nothing here, it just makes the overhead more expensive.

The key take here: **full event sourcing across a whole domain is right for a narrow slice of systems**. For most applications, adopting it wholesale costs more than it returns.

**But the *ideas* were right** even where the full pattern was wrong. Separating intent from execution. Writing down what the user asked for before doing it. Treating a request as a durable fact rather than an in-flight connection. Those seemed valuable at a much smaller scale, in one endpoint, one module, one audit log. Which left me with a question: does the small version have a name, or was I just describing a queue with extra steps?

## Step three, Asynchronous Request-Reply: the same idea, one endpoint wide

The first is **Asynchronous Request-Reply**, and it's about the *interaction* between client and server.

A client sends a request whose processing is slow, or depends on downstream systems you don't control. The classic answer is to hold the HTTP connection open and hope. The pattern's answer is to stop doing that. The server accepts the request, returns `202 Accepted` immediately with an identifier (a job ID, a `Location` header), and the client either polls that identifier or gets notified later via webhook or WebSocket.

Underneath, **Command Message Queuing** describes how the work actually gets done. The incoming request becomes an explicit **command** object, something like `ProcessPaymentCommand`, and goes on a queue. Background workers pull commands off and execute them.

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
    except transient_failure:
        mark(command, PENDING, attempts += 1, next_attempt_at = now + backoff)
    except permanent_failure as e:
        mark(command, FAILED, reason = e)
```

That's it. And look at what you've bought.

**Retries by design.** The failure branch isn't error handling bolted on, it's the same state machine as the success branch. When the external API is down, the command sits in `PENDING` and gets tried again. The user does not see a `500` for something that wasn't their fault.

**Load smoothing.** Traffic spike, flash sale, whatever. The API's job is now just "write a row", which it does very fast. Ingestion happens at spike speed, execution at whatever pace your workers can sustain, and the queue absorbs the difference.

**An audit trail of intent.** The stored command is an immutable record of *what the user wanted*. If a bug corrupts your final state, you still have the original intent, and you can replay it. A benefit that feels like event sourcing, obtained from a single table.

And now the cost, because this step is cheap but not free. Your client needs somewhere to collect the result, which means polling endpoints or webhook delivery, infrastructure you didn't have before. And the awkward one: business errors now surface *after* you've answered `202`. You can no longer tell the user "your card was declined" in the response to their own request. That has to travel back through a notification, an email, or a status endpoint, and designing that path properly is usually more work than the worker loop itself. Anything the user must know immediately has to stay in the synchronous validation step, which puts real pressure on where you draw that line.

Still, this is the shape I originally wanted, and the shape my colleague had been describing all along. Separating intent from execution, applied at exactly one boundary, with no framework and no event store. One table and a loop.

## Step four: the dual write, and the Transactional Outbox

Step three left the worker doing its job against a single database, which is a comfortable place to be: one database means transactions. Now give that worker the one extra responsibility every real system eventually needs. Once it has saved the order, it also has to tell somebody else, so it publishes a message to a broker.

That's two writes, to two different systems, with no transaction covering both, and it has a name: the **dual-write problem**. The database transaction can commit while the publish fails, and you get an order that nobody downstream ever hears about. Or the publish succeeds and the transaction rolls back, and the rest of the company reacts to an order that doesn't exist. You can wrap the database write in a transaction. You cannot enrol the broker in it. So the two can disagree, and when they do, nothing tells you.

The usual mitigations, retries and try/catch and publishing only after the commit, all narrow the window without closing it. The process can die *inside* the window. There is no arrangement of two independent writes that is atomic. The only real fix is to stop having two writes.

The **Transactional Outbox** pattern: instead of publishing to the broker, insert the message into an `outbox` table **in the same database transaction** as your business data. One transaction, one commit, all or nothing. Then a separate process reads the outbox and publishes onward.

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

The relay itself can be boring. In the Spring world it's a `@Scheduled` method that reads the unpublished rows and hands them to a `KafkaTemplate`.

Now look at that relay loop again, because it doesn't fully escape the problem either. It publishes, then it marks the row as published, and those two steps aren't atomic: a crash in between sends the same message twice. The outbox hasn't deleted the risk, it has *moved* it, from "the message might be lost" to "the message might arrive twice". That trade is the whole point. A lost message is unrecoverable. A duplicated one is a normal engineering problem.

That's called **at-least-once** delivery: every message arrives, some arrive more than once, and the responsibility shifts to whoever receives them. Those receivers have to be **idempotent**, meaning that handling the same message twice leaves the system in the same state as handling it once. In practice that's an identifier carried in the message (the order ID is usually sitting right there) plus a uniqueness constraint or a "have I already processed this one?" check that turns the second attempt into a no-op. Once messages are moving between systems, idempotency stops being a detail and becomes a house rule.

### Step five-and-an-half: linking the dots with previous ones

It's worth stopping here, and look at a small variation of the previous pattern. That's a key point that one, that's where we link to the previous ones.

**Listen to yourself** is a variation of the Transactional Outbox, where we simply inverts the order. Instead of writing your state and an outbox row together, you publish the event to the broker *first*, and then let your own service consume its own event and update its local state from it. There is only one write, so there is nothing left to disagree with, and the broker becomes the source of truth. Sounds familiar?

It's basically step three, asynchronous request-reply, **implemented with events instead of a command table**. The endpoint accepts the request, publishes the fact, answers `202`, and the real work happens later when your own consumer picks the event up. Same separation between intent and execution, different transport. The price is the one from step two: your own state is now eventually consistent with the event you have just published, so anything reading immediately afterwards can still see the previous value, and you have to decide whether your domain tolerates that. There's also a harder operational edge. If the broker is down you cannot accept the request at all, whereas the outbox would have kept collecting rows in your own database and shipped them once the broker came back.

**Event sourcing** closes the circle from the other side. If the event you publish is also the event you store, then the outbox table and the event store stop being two different things. There is no second write to disagree with, because the write *is* the event. The dual-write problem doesn't get solved so much as it stops existing, and that, quietly, was part of what step two was selling all along.

Which is the pattern behind the whole article. The command table in step three, the outbox table in step four and the event store in step two are the same idea at three different prices: write down the fact first, and let the consequences happen after.
## Step five: zoom out, and it's Event-Driven Aarchitecture

The last step needs no new machinery. Just a change of scope.

Everything so far has been inside one application. The outbox row was published to a broker so *your own* background worker could pick it up. Now stop thinking about your service and think about the whole company.

That same `OrderPlaced` event, published to a shared enterprise broker like Kafka, isn't just yours anymore. Billing consumes it to issue an invoice. Inventory consumes it to decrement stock. Shipping consumes it to create a label. Analytics consumes it because analytics consumes everything.

None of those services called your API. You didn't call theirs. You don't know they exist, and, this is the important part, you don't have to change your code when a fourth one shows up next quarter. You published a fact. Whoever cares, cares.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2026-08-21-from-cqrs-to-event-driven-architecture/06-eda.png" alt="Event-driven architecture: the order service relay publishes OrderPlaced to a Kafka topic, consumed by billing, inventory, shipping and analytics, each with its own database">
  <figcaption>The outbox pattern, with a wider audience</figcaption>
</figure>

That's **Event-Driven Architecture**, and it's just the outbox pattern with a wider audience.

Which reframes what the outbox actually is. It's tempting to think of it as just a reliability trick, but it's more than that: **the Transactional Outbox is the safety mechanism that lets you adopt EDA without losing data.** Without it, every service publishing to the shared broker has an unguarded dual write, and your beautifully decoupled architecture is silently losing messages at every node.

I should be as honest about this step as the others, because "global decoupling" makes it sound free, and it isn't. You give up global ordering, so events about the same entity can reach a consumer out of sequence. You inherit at-least-once delivery organisation-wide, so every consumer needs the idempotency we keep coming back to. Debugging stops being a stack trace and becomes a correlation ID chased across five services' logs. And the subtle one: **your event schema becomes public API.** A REST endpoint has known callers you can go and talk to. A Kafka topic has consumers you've never met, in teams you don't know, and changing that event's shape is a negotiation across the whole company. The coupling didn't disappear, it moved into the payload, where it's harder to see.

## What I actually took away

I set out to fill in a missing piece, and ended up tracing, accidentally and roughly backwards, the path the industry took to arrive at event-driven architecture. Five steps: CQRS, event sourcing, asynchronous request-reply, the transactional outbox, EDA.

The thing I wish someone had told me at the start is that **these are separable**, and that the two most commonly welded together are the two that need it least. CQRS costs almost nothing and you can have it this afternoon. Event sourcing costs a great deal and will still be costing you in year three, when you're writing upcasters for an event shape you designed before the product changed direction. Reading them as a single package made me evaluate the cheap idea at the expensive idea's price, and reject both.

Concretely, that means using these ideas *surgically*. Which brings my manager's audit logs back. That instinct was right: an audit log is a perfect fit for event sourcing, and it requires nothing else in the application to change. Append-only, immutable, replayable, the pattern's strengths with almost none of its costs, because nobody queries an audit log to fill a dropdown. What I couldn't have said back then is the second half of it: the audit log can be event-sourced without the rest of the system following it there. A slow or fragile endpoint is a perfect fit for command queuing, with an outbox table, a `202 Accepted`, and a worker loop. Everything else stays boring. Same layered stack, same single database, same in-place updates. That's fine. That's *good*, actually.

There's a broader habit in here. When a pattern feels ten sizes too big, the useful move usually isn't to reject it and go back to what you were doing. It's to figure out which *specific problem* it was designed to solve, check whether you have a smaller version of that problem, and take the smaller version of the solution. Big patterns are usually small patterns that grew to fit a domain harder than yours.

I never did end up needing an event store. I got a table with a `status` column, and a loop. But I only knew that was the right answer because I'd gone all the way up first, and now, when someone drops "we could use events here" into a brainstorming session, I know exactly which step they mean.

---

*Michael Ploed's [SpringOne2GX 2015 talk on CQRS and Event Sourcing](https://www.youtube.com/watch?v=A0goyZ9F4bg) is the clearest single walkthrough of the event-sourced end of this story, and the source of the incident management example. For the case that CQRS is a much smaller thing than its reputation suggests, see Greg Young's [CQRS is not an Architecture](https://gregfyoung.wordpress.com/2012/09/09/cqrs-is-not-an-architecture/) and [Martin Fowler's bliki entry](https://martinfowler.com/bliki/CQRS.html). For a concrete outbox implementation in Spring Boot, [this repository](https://github.com/ChintaHari/springboot-transactional-outbox-pattern) is a good starting point.*
