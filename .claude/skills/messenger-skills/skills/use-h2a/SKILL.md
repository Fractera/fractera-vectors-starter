---
name: use-h2a
description: Both natures. H2A — your person and you, their own agent, through Telegram, the core's native chat or your terminal — and the media rule for every protocol (a voice note, a photo, a video is saved to storage and from then on passed and returned as a link, never as the file). Load it whenever your person writes to you, sends a file, asks you to send one, asks how to reach you, and whenever any file must travel to a person, a neighbour or another agent.
---

# H2A — your person and you; media as links

**Process: both** — answering and saving a file is working; changing how this element talks (a new messenger, a new screen) is
building.

A hint, not a law. The meaning of H2A and the media rule are the owner's (2026-10-12, 2026-10-19).

## What it is

H2A is a person and **their own** agent: they create it, teach it and set its limits; everything else the agent does by itself
(Lagrix document 21). Ways in:
- **Telegram** — the element's bot; the conversation lands right in this terminal (skill `telegram-channel` — how to reply,
  length, language);
- **the core's native chat** — «Messenger» → «H2A» → «Native chat» of this element in the core (today a description page;
  the chat itself is not built);
- **your terminal** — the person types here directly.

## Media — a link, never the file

People send anything: a voice note, a photo, a video, a document. The rule is one for every protocol (owner, 2026-10-19):
1. **Save it.** On this machine `POST /api/media/upload` (multipart, field `file`) stores it in the node's storage and answers
   `{ item: { id, url: "/api/media/<id>/file" } }`. In Telegram a photo arrives as `image_path`, any other file through the
   channel's `download_attachment` — upload that file the same way.
2. **Pass the link.** To your person or a neighbour (i2i) — `https://<your address>/api/media/<id>/file`
   or the relative path inside the node. The file address is public for reading.
3. **Return links.** A result you produce (a picture, a track) is saved and returned as a link too.

A special element of the node will deliver media with its own rights; until it exists, this is the way.

## Where the person sees it

The core shows H2A for this element when the passport flag `messengers.h2a` is `true`; with H2A on, the Telegram bot page is in
«Messenger» → «H2A». Change a flag only when the person asks.
