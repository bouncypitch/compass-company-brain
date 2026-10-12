# #deals-competitive — "Tallgrass is closed-lost"

**Date:** 2026-09-18 · **Participants:** Derek Mbeki, Lena Park, Ben Castellano, Megan Cho, Kai Nakamura

---

**Derek Mbeki** 10:42 AM
Bad news, team. Tallgrass Financial went with Cursor. 140 seats, ~$420K ACV. Closed-lost in Salesforce, notes in `customer-notes/tallgrass-financial-lost-deal.md`.

**Ben Castellano** 10:44 AM
Ugh. What was the deciding factor? We beat them on the security review.

**Derek Mbeki** 10:47 AM
Direct quote from their Director of Platform: *"By week two, Cursor remembered our repo conventions — our error wrapper, our test fixture pattern, the fact that we never import from `legacy/`. Forgeline was like onboarding a new contractor every morning."*

**Lena Park** 10:49 AM
Can confirm, I ran the bake-off. Our agent kept using `log.Printf` instead of their `tglog` wrapper. Every. Single. Session. I corrected it in review on day 1, day 3, day 6. Their reviewer started a tally on the whiteboard 😬

**Lena Park** 10:50 AM
Also every new `fl` session kicked off a fresh index of their 1.8M LOC monorepo. ~11 min of "Indexing…" before the agent did anything. They timed it.

**Megan Cho** 10:52 AM
Same story at Ostrander last month in the expansion convo. "Devin learns from our PR reviews." I didn't have a good answer.

**Kai Nakamura** 10:55 AM
This is R-14 on the roadmap (agent memory). It's in Later and unowned. I've raised it at roadmap sync a few times.

**Ben Castellano** 10:56 AM
How is the #1 loss reason in Later? 🙃

**Kai Nakamura** 10:58 AM
Honest answer: it spans Platform (indexing/storage) and Agent Eng (the loop), so each side thinks the other owns it. No design doc exists.

**Derek Mbeki** 11:01 AM
Tallying Q3 competitive losses: 5 of 9 cited some version of "the other one remembers our codebase." That's GTM-KR1 in a nutshell.

**Ben Castellano** 11:03 AM
I'll bring it to roadmap sync. Lena, can you write up the bake-off timeline with the specific repeated corrections? Concrete > vibes.

**Lena Park** 11:04 AM
On it. Will include the whiteboard tally photo. It's at 14.

**Megan Cho** 11:05 AM
frame it and put it in the office as motivation
