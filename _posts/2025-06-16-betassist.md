---
title: "Live Scores, Real Pride: The Story Behind BetAssist"
date: 2025-06-16
excerpt: "\"What's the project you're most proud of?\" Every software developer has faced this question at least once. Maybe during an interview, maybe in a conversation with a colleague, a friend—or even with themselves."
tags: [projects, java, android]
image: /assets/article_images/2025-06-16-betassist/cover-image.png
---

**"What's the project you're most proud of?"**

Every software developer has faced this question at least once. Maybe during an interview, maybe in a conversation with a colleague, a friend—or even with themselves. Most of the time, it's not an easy one to answer.

It was June 2022. I was deep into the hiring process with a foreign software company. Not a big tech giant, but one of those solid mid-sized companies with a structured, multi-step approach. One of those steps was a behavioral interview. The interviewer asked about my values, how I approached challenges, and how I'd handled difficult situations.

That's when the famous question came up again.

I paused for a few seconds. I had worked on many projects over the years, so picking just one wasn't easy. But after a moment of reflection, I decided to stop overthinking and go with the most honest answer that came to mind:

**"BetAssist."**

That was my bet.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2025-06-16-betassist/header.png" alt="First BetAssist header on the Google Play store.">
  <figcaption>First BetAssist header on the Google Play store.</figcaption>
</figure>

---

## The Idea

I genuinely think BetAssist is the project I'm most proud of. It's an Android app I started building back in 2017. Its main purpose? To **track football betslips** with live score updates and offer betting suggestions.

For the unfamiliar, a **betslip** is essentially a form that records the details of a sports bet. At the time, in Italy, it was still common to place bets in physical shops and walk away with a paper receipt. You had to track your results manually—either by following each game individually or checking scores across various apps or websites. The official betting apps either weren't great yet or weren't widely adopted.

That's when the idea hit me:
_What if all of this could be done in a single app?_

---

## The Process

In 2017, I was in my second year of a Computer Science degree. I had just finished an object-oriented programming course in Java and was eager to apply those concepts in the real world.

At that time, Android apps were still written in Java. So I picked up a book I still have in my Google Drive to this day: [_Android Programming for Beginners_ by John Horton](https://github.com/PacktPublishing/Android-Programming-for-Beginners-Third-Edition). It was a hands-on introduction to Android development using Android Studio. The book's main project was a simple note-taking app, which was used to teach UI design, app lifecycle, persistence, networking, and more.

I followed the guide chapter by chapter. But in the back of my mind, I was already thinking about BetAssist.
_"This ListView for notes would be perfect for a betslip list!"_
That single thought drove my motivation and learning throughout the book.

By the time I finished, I was ready to move on to something of my own.

---

## The MVP

The first version of BetAssist was simple: a **betslip editor**.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2025-06-16-betassist/mascotte.jpg" alt="The BetAssist Mascotte">
  <figcaption>BetAssist had a mascotte also. It didn't have a name, but was used on some of the graphics and logo, inspired by the Android original logo.</figcaption>
</figure>

Users could create betslips by combining clubs from various European leagues. They could define matches, choose outcomes like 1X2 or over/under 2.5 goals, assign dates, and—crucially—receive phone notifications when the matches ended.

I had so much fun building it. I loved the immediacy of Android Studio. I could see results instantly, even on my personal phone. I even designed the UI myself—experimenting with colors, layouts, and a logo (which got me to learn a bit of Photoshop along the way).

But despite how fun it was, I knew it wasn't quite _there_ yet.

It was, at that stage, little more than a glorified note-taking app. It hadn't yet solved the core problem. It wasn't a product—it was a personal sandbox. But I already had ideas for version 2.

---

## Things Getting Live

To become truly useful, BetAssist needed one critical upgrade: **live scores**.

I didn't want to get tangled in web scraping, and there was no chance I'd enter scores manually. So I started looking for APIs. That's when I found [Football-Data.org](https://www.football-data.org)—a free API with access to near real-time football scores from major European leagues.

The free tier was generous and perfect for my needs. Even today, I think it's a gem: live scores (with a ~10-minute delay), solid coverage, and reasonable rate limits. For a small monthly fee, you could even unlock global data—but I never needed to.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2025-06-16-betassist/architecture.png" alt="Architecture Overview">
  <figcaption>Quick overview on the BetAssist Architecture</figcaption>
</figure>

Like many early developers, I started small. A university friend and I built a backend in **PHP** (yes, forgive us—it was all we knew besides Java), hosted on **Heroku**. Every 10 minutes, the backend would ping the Football-Data API, collect score updates, and store them in **Google Firestore**.

Why Firestore? It integrated seamlessly with Android, had a generous free tier, and—let's be honest—I wasn't ready for anything more complex at that point. But it worked. And looking back, it was kind of impressive that it worked at all.

Eventually, I added a section for browsing upcoming matches, with quick actions to start building betslips. And most importantly, **live score notifications** were now in place.
The betslip lifecycle was finally complete.

BetAssist had become a real product.

And it was the best feeling in the world.

---

## Growing Together

With the app working, I couldn't wait to share it with the world. I created a developer account on the Google Play Store and prepared for launch.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2025-06-16-betassist/screens.jpg" alt="Original Screenshots">
  <figcaption>Original screenshots from the BetAssist app.</figcaption>
</figure>

I'll spare you the gritty details (maybe another blog post someday), but publishing your first app is a trip. Keystore generation, signing builds, making screenshots, writing copy, creating privacy policies—it's a lot.

But eventually, **BetAssist was live**.

Seeing real people download and review something you built is electrifying. The download count ticked up. Comments started appearing. It wasn't millions of users—but it was _mine_.

Over the years, the app grew, and so did I. I added match predictions (basic regression models running on the device), partnered with websites, improved the design, and refactored endlessly as my coding skills matured.

At one point, I even monetized the app. I added banners, and later a paid "Pro" version without ads. To my surprise, it actually brought in some money. Not a fortune, but enough to feel _real_.

Eventually, I stopped the monetization. I wasn't sure whether it was fully legal to earn revenue without a proper _partita IVA_ (Italian VAT number), and I didn't want to risk it.

But truthfully, the money was never the point.

---

## The Present

Today, BetAssist is mostly in hibernation.

The Heroku backend was shut down about a year ago. I think the app is still available on the Play Store, though only partially functional.

BetAssist was never meant to be a business. It was my lab. It was where I learned to write real code, ship to real users, and fix real bugs.

It was the first time I saw something go from an idea in my head to a thing in people's hands. And I believe every developer needs that kind of project—one that belongs entirely to them.

In the end, the most important feature of BetAssist wasn't live scores, push notifications, or betting logic. It was **momentum**—the creative spark it gave me, the confidence it built, the curiosity it unlocked.

So if you're a developer stuck in tutorials, wondering what to build next—just start. Solve your own problem. Scratch your own itch. It doesn't have to be revolutionary. It just has to matter to _you_.

Because sometimes, the best way to grow isn't by reading more books. It's by betting on yourself.

And honestly? That's a bet worth taking.
