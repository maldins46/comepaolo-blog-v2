---
title: "The Canestreet Website: From a Simple Showcase to the Tournament's Core ERP"
date: 2026-05-17
excerpt: "The website or our tournament is more than that. It is a full ERP tailored to our need. And the history of that, a spinoff it is worth to tell."
tags: [projects, basket, react, vercel]
image: /assets/article_images/2026-05-07-canestreet-website/cover-image.jpg
---

If you type [`canestreet.it`](http://canestreet.it) into your browser's search bar, you’ll land on a sleek, modern website. The subject is instantly clear: a summer basketball tournament. The splash screen greets you with action shots from the courts, and a quick glance reveals everything you’d expect from a sports hub: team registration, live results, official rules, and a curated "About" section.

It looks exactly like what a professional tournament needs. And, as you might have guessed, it’s a website I built 😏

Canestreet is the name of a small summer basketball tournament we host every year in my hometown Jesi, Italy. We’ve been running it for eight years now. What started out as a casual joke among friends has evolved into a highly anticipated summer event. And with that growth came a mountain of logistical headaches.

This article isn’t about the tournament itself (I’ve written [a whole other piece on that](https://riccardomaldini.it/blog/canestreet-3x3), which I highly recommend reading first). Instead, this is a spin-off story. It’s a deep dive into a tool I briefly mentioned in the main article, but one that deserves its own spotlight: **the Canestreet digital ecosystem**.

---

## The Good Ol’ Times: Rough Basketball and Small Needs

Canestreet was born in 2018, primarily as a fun way to break up the sweltering Italian summer heat. A few friends and I set up a modest event on a small basketball court owned by a local church.

In those early days, we didn't need much technology. Word of mouth was our primary marketing engine. We only needed eight teams to make the tournament viable, and we reached almost all the players through friend-of-a-friend networks.

To give the event a slight digital footprint, we created [an Instagram page](https://www.instagram.com/canestreet3x3). It was mostly fueled by memes, funny team descriptions, event announcements, and stories updating the match results. It was the perfect, low-friction hotspot to keep players engaged.

People absolutely loved the tournament. We kept replicating the model year after year, even when we upgraded to a much larger playground. For nearly five years, Instagram remained our de facto point of contact with the outside world.

On the organizational side, however, we needed a bit more structure to track rounds, points, and final brackets. Pen and paper quickly became a nightmare for a tournament with more than 50 players. Our grand upgrade? **A massive web of Google Sheets**. At the time, it was a medium perfectly tailored to the size of our needs. But as the tournament continued to balloon, we began craving something that felt a bit more professional.

---

## The First Website: The Showcase We Needed

We managed to run the tournament for three consecutive years before Covid brought everything to a grinding halt. That forced hiatus gave us time to rethink our next steps. More importantly for this story, it handed me, as a programmer, an abundance of free time to invest in whatever random side project crossed my mind.

That lockdown boredom was the exact cradle where **the first version of the Canestreet website was born**.

I wanted to give the tournament a proper virtual home. Instagram would still be our primary way to engage users, but like any growing entity, we needed a dedicated space on the web to showcase who we were outside of social media silos. Let's be honest: an Instagram page isn’t the best business card when you're pitching to a serious potential corporate sponsor.

Like any good engineer, I started by collecting requirements. What does a tournament website actually need?

* A **Homepage**: A visual showcase with photos and a compelling description of the event.
* **Contacts**: Where to find us, and an easy way for local businesses to reach the main organizer for sponsorships.
* A **News** Section: A place for updates that could be easily shared via a single permalink.
* The **Wishlist**: A registration portal, an interactive rules page, and live match results.

Reconciling all of these features was a massive challenge for me at the time because my web development experience was pretty limited. I had experimented with a few small projects using Angular and headless CMSs (see [the origins of CovidAnalysis](https://riccardomaldini.it/blog/covidanalysis) and [my blog](https://riccardomaldini.it/blog/my-website) for more funny stories!), but I had never built a comprehensive, production-grade web application.

Following the breadcrumbs of convenience led me straight to a precise technology. I had to strike a deal with the framework I disliked the most—the monster that powers half the web, yet is widely mocked by developers everywhere.

Yes, I’m talking about **WordPress**.

I genuinely disliked (and still dislike) WordPress. It’s a CMS born for simple blogging that has been aggressively bent, twisted, and forced by themes and plugins to act as a solution for every website requirement under the sun. It’s flexible, sure, but forcing a tool so far outside its original scope always felt fundamentally wrong to me.

Yet, because it was an industry standard, it was the most pragmatic place to start experimenting. I knew that learning my way around a tool used by half the internet would eventually be a useful skill to have in my back pocket.

So, I held my nose, bought the domain `thecanestreet.it`, and linked it to a hosted WordPress instance. That's the resulting stack I came out with:

| Component | Technology | Cost | Why We Used It |
| :--- | :--- | :--- | :--- |
| **Framework** | **WordPress** | Free (OSS) | The industry standard for quickly building functional web spaces. |
| **Page Builder** | **Elementor Plugin** | Free Tier | Allowed drag-and-drop page creation without deep frontend experience. I didn't want to invest too much time on that. |
| **Sports Engine** | **WP Club Manager** | Free | A pre-built plugin used to handle matches, players, and standings. |
| **Registrations** | **Google Forms** (iFrame) | `€0` | Embedded directly into the page to collect user sign-up data. |
| **Hosting & Domain** | **Self-Hosted** | `€25 /year` | Necessary to get a custom domain, Linux hosting and the WordPress database. |

Quite cheap, but not free as you can see. I spent a month tinkering with the Elementor plugin, building out the pages we needed one by one. I built the homepage, added an "About" and "Contact" page, and even embedded a PDF viewer to display the official FIBA 3x3 rules. Finally, I spun up a news section utilizing the native WordPress blog architecture.

This first iteration actually survived for four years. Over time, I expanded its capabilities by adding a third-party plugin for live sports casting and embedding a basic Google Form iFrame to handle player sign-ups.

The solution was minimal, but it got the job done. The glaring downside? The sheer amount of manual data manipulation required behind the scenes:

* **Registrations**: Teams submitted forms, but everything after that was manual labor. We had to manually export the data from Google Sheets, email the team captain to confirm, and spend days chasing people down to validate physical sports insurance and federation certificates.
* **Live Scoring**: The sports-casting plugin required an immense amount of configuration. Updating scores during a fast-paced game was tedious, and getting brackets to align properly with complex FIBA tie-breaker rules required constant manual intervention.

Every time a developer handles a repetitive task that could easily be automated, an angel loses its wings 🥴 I knew I needed a change.

---

## The Second Website: The AI Breakthrough

Then came the dawn of 2026, and everything shifted.

Over the previous several months, generative AI tools designed specifically for coding evolved from amusing novelties into powerhouse assistants. The launch of advanced coding models completely revolutionized our day-to-day engineering workflows.

These tools successfully took over the heavy lifting of concrete syntax and boilerplate implementation, freeing us up to focus on high-level architecture, system design, and product specifications. I was fortunate enough to be working at a company that actively encourages using tools like **ClaudeCode**, or **OpenCode**, even subsidizing licenses for our personal development. It’s a massive win-win: continuous self-training for the employees, and unlimited building potential for the engineers.

I decided to burn down the old WordPress site and build a custom application from scratch. I didn't want just a public showcase anymore; I wanted a fully bespoke Enterprise Resource Planning (ERP) system tailored perfectly to the chaos of a 3x3 basketball tournament.

I brainstormed architectures, aiming for modern tech stack performance while keeping hosting costs at a grand total of zero, or near-zero Euros per year.

| Component | Technology | Cost | Why We Used It |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js** (React) | `€0` | Single codebase for both frontend UI and API backend routes. |
| **Hosting** | **Vercel** | `€0` | Seamless deployment and incredible loading speeds. |
| **Database** | **Supabase** (PostgreSQL) | `€0` | Relational powerhouse on a generous free tier. |
| **Assistant** | **Claude Code** | Sponsored | Handled the heavy boilerplate lifting in seconds. |
| **Domain** | **canestreet.it** (GoDaddy) | `€10 /year` | Sticked to the provider since i have previous sites here (using other ones i could have expeded even less). |


I had a functional, bare-bones prototype running in less than an afternoon. I was completely stunned. In just a few hours, I managed to build the core repository skeleton alongside clean, responsive designs for the home, about, contact, and rules sections.

Galvanized by this newfound velocity, I kept iterating. Within a week, the public-facing application was complete. The following week, I turned my attention to building a custom administrative back-office dashboard.

Built entirely around the real pain points we gathered over seven years of running tournaments, the new system seamlessly automates our entire operation:
* **Automated Registrations**: Teams register directly via custom web forms. The app parses the data, alerts the staff, and fires off beautiful automated confirmation emails once approved.
* **FIBA-Compliant Live Engine**: No more fighting generic sports plugins. Our backend automatically takes registered teams, generates round-robin groups, dynamically calculates standings based on complex FIBA 3x3 tie-breaker rules, and populates the playoff brackets in real-time for spectators.
* **Dynamic Sponsor Management**: Sponsors can be added, categorized (Gold, Silver, Technical), and updated instantly via the dashboard, automatically rendering them across the platform.
* **The Court Jumbotron (Showcase Screen)**: Solving an old logistical problem, I built a dedicated "Showcase View" meant to be projected on TVs or laptops around the courts. It loops through real-time scores, upcoming match timetables, and active sponsor loops without needing manual refreshes.
* **Three-Point Contest Module**: A streamlined micro-dashboard to register players for our annual shootout, input their scores live, and broadcast a real-time leaderboard to the crowd.

---

## Conclusion

Looking back at the trajectory of this project, it is genuinely incredible what a single independent developer can achieve with modern tools. Building a system of this complexity with my limited free time **would have easily taken me several months of grueling weekend work in the past**.

At the same time, working on this project clearly showed to me how it is easy to fall in rabbit holes, let the architecture degenerate into an unmaintainable mess. As engineers, it's more critical than ever that we maintain absolute control over the code, thoroughly understand the output, and never go on "full auto-pilot." Total reliance on automation is the easiest way to make a complex software project fail.

The best part? **The entire Canestreet platform is completely open-source and [available on my GitHub](https://github.com/maldins46/CanestreetWebsite)**! The tournament is my hobby, and this code is simply the engineering cherry on top. If you run a local sports tournament and want a tailored, automated management system to make your event shine, feel free to clone the repository. Just remember to give credit to a developer from Jesi and dintorni 🥰