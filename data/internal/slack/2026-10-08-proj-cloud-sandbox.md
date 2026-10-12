# #proj-cloud-sandbox — "R-09 status + staffing"

**Date:** 2026-10-08 · **Participants:** Nadia Haddad, Farah Qureshi, Priya Shah, Lena Park, Rosa Delgado

---

**Nadia Haddad** 4:02 PM
Weekly R-09 update:
- Firecracker pool in `us-west-2` stable; 1 design partner (Ostrander Games) running background agents in cloud sandboxes. 214 runs last week, 3 failures (all egress allowlist).
- Blocked for partners 2–5 on: VPC peering for on-prem customers, secrets injection, and per-tenant image builds.
- PE-KR4 target is 5 partners by EOQ. Honest forecast: 2–3 at current staffing.

**Farah Qureshi** 4:05 PM
I'm at 50% on this (other 50% on follow-ups to the ingest band-aid, FL-4398). The image build pipeline is maybe 2 weeks of focused work.

**Priya Shah** 4:09 PM
I've requested +1 headcount for R-09. Arjun's answer: "likely approved for Q1." So Q4 is what we have.

**Lena Park** 4:12 PM
From the field: background agents running only on the dev's laptop comes up, but less than memory. Halvorsen asked "can it run overnight without my laptop open?" Brightwater wants it in their VPC. I'd rank it #2 objection after "it forgets our codebase."

**Rosa Delgado** 4:15 PM
Security will want sandbox audit events in the R-03 audit log export. Can we spec that now so it's not a surprise?

**Nadia Haddad** 4:16 PM
Yes please. FL-4502.

**Nadia Haddad** 4:18 PM
Also, minor: the sandbox cold-starts by cloning + indexing the repo from scratch, which takes ~9 minutes on big repos. If ingest ever gets a persistent commit-keyed index (the thing Jordan mentioned), sandbox boot would drop to under a minute. Two problems, one fix.

**Priya Shah** 4:20 PM
Noted. That's an argument for doing the persistent index first.

**Farah Qureshi** 4:21 PM
our sandbox has the memory of a goldfish and the boot time of a 2009 laptop. great pitch
