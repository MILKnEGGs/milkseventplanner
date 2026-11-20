# Milk's Event Planner

Plan birthday parties and other get-togethers on your phone: who's invited and who's coming, the invitation, the place,
the to-do list, food, budget and the day itself.

- **Events**: kind (birthday, party, holiday, shower, wedding/anniversary, dinner, cookout, graduation), who it's for and the age
  they're turning ("Ava's 7th Birthday" is written for you), date, start/end, RSVP-by date, place (name, address, parking notes),
  theme and notes. Home shows upcoming events with a day countdown, an RSVP bar, the coming headcount and open to-dos.
  Past events fold away. **Plan another like this** copies an event with every answer, check-off and payment reset.
- **Guests & RSVPs**: one row per household with adults and kids. Guests never RSVP through the app; you set Not invited /
  Invited / Coming / Maybe / Can't. Invited rows get one-tap Coming / Maybe / Can't buttons. Once someone says yes you can set
  how many are actually coming (one parent drops off). Paste a whole list at once (`The Smiths 2+2`, `Grandma`,
  `Liam 555-123-4567`) or pick households from your other events. Allergies and notes per household.
- **Invitations**: the message is written from the event details and stays up to date (or word it yourself). Share or copy it,
  or text / email each household one by one (opens Messages or Mail with it filled in and marks them invited). There's also an
  invitation **card** picture in three looks (confetti, balloons, stars) to share or save. Your name and phone in Settings go on
  the "Please RSVP to …" line.
- **To-do**: a starter checklist per kind of event. Due dates are "days before the party", so they move when the date does.
  Grouped into overdue, this week, later. The To-do tab lists open to-dos across all upcoming events.
- **Food**: allergies and dietary needs from the guest list, how many you're feeding, your menu and who's bringing what.
- **Budget**: a budget, expense lines with paid / not paid, what's left and the cost per guest.
- **Day of**: a schedule (or start from a sample one), check guests in as they arrive, then note gifts and tick off thank-yous.
- **Calendar**: add the event to your phone's calendar (.ics with a reminder the day before).

Everything stays on the device (IndexedDB). It works offline once opened and installs to the Home Screen.
Settings → Export backup moves everything to another device.

## Develop

```
npm.cmd install
npm.cmd run dev      # http://localhost:5173
npm.cmd test         # dates, headcounts, guest-list parsing, to-dos, invitation wording, budget, duplicate, backup, calendar
npm.cmd run build    # svelte-check + production build into dist/
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`
(one-time setup: repo Settings → Pages → Source: "GitHub Actions").
