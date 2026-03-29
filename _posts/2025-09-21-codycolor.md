---
title: "CodyColor Multiplayer: From a Thesis Project to a Startup Game"
date: 2025-09-21
excerpt: "The history of how I developed CodyColor, a web online game for learning purposes."
tags: [projects, angular, node]
image: /assets/article_images/2025-09-21-codycolor/cover-image.jpg
---

2019 was a year of big changes in my life.

I had just graduated with my bachelor's degree that February. My course was *Informatica Applicata*: that's roughly equivalent to Computer Science outside Italy. I already liked programming, even though, looking back from where I am now, I was just at the beginning of my journey.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2025-09-21-codycolor/university.jpg" alt="It's me during my degree!">
  <figcaption>Me and my beloved colleghi urbinati</figcaption>
</figure>

I still remember my thesis well: *Utilizzo del pattern Publish-Subscribe e dei Message Broker nell'implementatione di giochi online Multiplayer e Applicazioni Distribuite* 🗣📢🔥

A very roboant name for a thesis, isn't it? It was based on experiments I did with message brokers (mainly [RabbitMQ](https://www.rabbitmq.com/)) and the [publish-subscribe](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) pattern, during an internship at a software company in my town.

It was an interesting topic, one that hadn't been covered during my studies. But as I discovered during my internship, message brokers are essential in microservice, or even simpler multi-service architectures, especially when handling asynchronous communication.

As part of my thesis, I also built a small browser-based multiplayer game. It was simple but fun: every player controlled a ninja cat who could throw fireballs at others on a Super Mario–like map.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2025-09-21-codycolor/ninja-cat.png" alt="Example of gameplay">
  <figcaption>A screen from the thesis about the NinjaCat gameplay.</figcaption>
</figure>

The real highlight, though, was the backend. Building on my RabbitMQ experiments, I developed a small Node.js application that used RabbitMQ to manage multiplayer rooms. Communication between client and server ran over WebSocket.

On the day of my thesis defense, I even prepared a live demo! Without the skills to host it on a real server, I hacked together a setup on my home PC, exposing both the client and backend to the internet. It worked, and the professors could interact with the game live. Their surprised faces made it worth it.

So, why am I telling you all this? Because one of those professors was particularly impressed. At that time, he was launching a university spin-off company aimed at developing small games and tools for teaching children in elementary and middle school the basics of programming. After seeing my demo, he invited me to join his company.

It was an unexpected but exciting proposal. I decided to seize the opportunity and see where life would take me.

---

## CodyColor Multiplayer

About a month later, I joined the company: **[Digit Srl](https://digit.srl)**.

Digit was a small start-up, backed by the University of Urbino. Out of four employees, two were researchers continuing their projects, while the other two were recent graduates — me and another guy.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2025-09-21-codycolor/colleagues.jpg" alt="Colleagues">
  <figcaption>Selfie with my Digit colleagues!</figcaption>
</figure>

My focus was on building a multiplayer game called [**CodyColor**](https://codycolor.codemooc.net).

CodyColor is actually a **coding method**: a set of simple rules that can be turned into different types of games. The company already had an offline version, played with physical tiles and pawns, and the plan was to bring it online.

Here are the basic rules:

* The playing field is a **5x5 grid** (though it can be any size).
* Each square can be colored **yellow**, **red**, or **grey**.
* Each player controls a robot, Roby, who moves based on the color of the square:
  * **Yellow** → rotate 90° left
  * **Red** → rotate 90° right
  * **Grey** → move forward

After a turn, Roby continues to the next square in its new direction.

---

## Bringing It to Life

Digitalizing CodyColor was not easy, especially since I had zero experience with game development. But I did what I always do: learn by example.

For the frontend, I used [AngularJS](https://angularjs.org) (yes, the grandparent of [Angular](https://angular.dev/)). For the backend, I built a NodeJS app, communicating with the client via a single WebSocket channel. All of the heavy work was made possible via [StompJs](https://github.com/stomp-js/stompjs), implementing the publish-subscribe pattern over WebSocket.

With some help from the colleagues, the project began to take shape. I first built a single-player version with a simple AI opponent. I worked with the HTML canvas, added drag-and-drop robots, and integrated resources from the offline version.

To my surprise, the game started to come alive. Within a month, I had a working single-player prototype.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2025-09-21-codycolor/gameplay-cody.jpg" alt="Gameplay example">
  <figcaption>Screens from the CodyColor game.</figcaption>
</figure>

---

## Switching to Multiplayer

The next step, of course, was multiplayer.

Over the following months, we managed to make the magic happen again. We didn't just create a multiplayer version—we also built a **battle royale mode**, where dozens (even hundreds) of players could compete in the same room.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2025-09-21-codycolor/children.jpeg" alt="Children">
  <figcaption>Children from an elementary school playing with CodyColor in a Battle Royale.</figcaption>
</figure>

We added a shared leaderboard and even allowed players to log in with federated identities. Using [Firebase Authentication](https://firebase.google.com/docs/auth) and [Firestore](https://firebase.google.com/docs/firestore), we could manage this almost for free, given the small user base.

As a fun spin-off, I developed a **[wall version](https://wall.codycolor.codemooc.net)** of the game. It ran on a TV in our company's display window. A QR code invited passersby to scan it, instantly joining a match against the AI visible on the screen.

<figure>
  <img src="{{ site.baseurl }}/assets/article_images/2025-09-21-codycolor/wall.jpg" alt="Wall">
  <figcaption>Codycolor Wall in the Digit Srl showcase.</figcaption>
</figure>

---

## Conclusion

In the end, I had built a real product with my own hands—despite starting with almost no knowledge of JavaScript.

CodyColor Multiplayer remains one of the projects I'm most proud of. Not because of its complexity, nor its code quality (honestly, the code was terrible). But because it showed me what I was capable of: learning on the go, solving problems step by step, and pushing through challenges instead of giving up.

It's one of the projects where I grew the most as a developer—and it all started with a simple opportunity I decided to take.
