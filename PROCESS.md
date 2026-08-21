# Process Notes

Supporting detail for the short process write-up. This documents the tool
choice, prompting approach, technical decisions and their tradeoffs, and how
the result was tested.

Live prototype: `https://innovateus-registration-form.vercel.app/`

---

## Tool choice

I used Claude as my AI assistant. I picked it because the work needed more than
code generation: I wanted to reason about the Directus schema, match an existing
design, and understand the backend pieces (HTTP requests, tokens, environment
variables) rather than paste them blindly. A conversational assistant let me ask
for explanations and push back when output was wrong.

## Tech stack

React with Vite. I already use this stack for my personal projects, so I could
move quickly, and it deploys to Vercel with almost no configuration. The form is
small enough that no extra libraries were needed; the Directus call uses the
browser's built-in `fetch`.

## How I prompted (representative prompts)

I prompted incrementally, one stage at a time, and gave the model real inputs
(the actual schema, screenshots of the live form) instead of descriptions. A few
representative prompts, paraphrased:

1. "Inspect the `cw_intake` collection schema and list the exact field names,
   types, and which are required." This surfaced that a `newsletter` boolean
   already existed, so I matched its exact name instead of inventing one.
2. "Build the form as a React component using one state object and one change
   handler; keep it explicit and readable." I asked for a single change handler
   so there was less repetition to maintain.
3. "Country only has 'United States' and 'Outside the United States'. Make
   State/Province a dropdown for US and a text box otherwise, both writing to the
   same field."
4. "Add the 14 event series as a required checkbox multi-select, and join the
   selected ones into a comma-separated string for `workshop_series`."
5. "Wire submit to POST to Directus using a token from an environment variable,
   with loading and error states, and explain how `fetch` reports failures."
6. "Explain why `fetch` does not throw on a 403 response, so I understand why the
   `response.ok` check is needed." (This mattered: without that check a rejected
   submission can look successful.)

Where output was wrong, I corrected it. Testing (below) caught two real defects
that I then fixed.

## Technical decisions and tradeoffs

- **Schema first.** I read the Directus schema before building so field names and
  required flags were exact, not guessed. This is why the newsletter field maps
  to the collection's existing `newsletter` boolean.
- **Conditional fields matching the real form.** State/Province swaps between a
  US-state dropdown and a free-text country box based on the country choice. The
  government-level dropdown only appears for the "Yes" answers, matching the
  schema note that `gov_level` applies only when the org answer is a yes.
- **Multi-select to a single field.** The 14 series are tracked as a list in the
  UI, then joined with commas at submit time, because the collection stores
  `workshop_series` as one text value.
- **Token in an environment variable.** Kept out of version control via `.env`
  (Vite exposes only `VITE_`-prefixed variables to the client). Honest limitation:
  for a frontend app this protects the source and git history, but the token still
  reaches the browser at runtime, so it is not fully secret. Full protection would
  require routing the request through a backend proxy, which was out of scope.
- **Scope of the newsletter feature.** The opt-in stores the user's preference as
  a boolean. Actually sending newsletters or a confirmation email would be a
  separate backend/email service and was out of scope.
- **Client-side validation only.** Validation runs in the browser. Directus
  enforces required fields server-side as a backstop, but a production system
  would also validate on the server.

## Testing

I tested by submitting records with unique, identifiable test emails and querying
each one back with a filtered API call, for example:

```bash
curl -g 'https://burnes-center.directus.app/items/cw_intake?access_token=<token>&filter[email][_eq]=neeraj-nl-1@example.org&sort=-id&limit=1'
```

Cases verified:

- Newsletter opt-in in both states: one record saved with `newsletter: false`,
  another with `newsletter: true`.
- The "Yes" government branch: the level dropdown appeared and `gov_level` saved.
- "Outside the United States": the State/Province field became a text box and the
  typed country name saved.
- Multiple event series: the selections saved correctly as one comma-separated
  string.
- Live deployment: I submitted from the deployed Vercel URL (not just locally) and
  confirmed the record persisted, which also confirmed the environment variable
  was configured in Vercel.

Bugs found through testing and fixed:

- Email validation initially only checked for an `@`, which let malformed
  addresses like `abc@gmail` through. I tightened it to require a domain, while
  deliberately keeping a "good enough" check rather than attempting perfect email
  validation.
- Some event series option strings were missing spaces, which showed up in the
  stored data during testing. I corrected the option text.

## Known limitations

- Token is not fully secret on a client-only app (see tradeoffs above).
- The header navigation is visual only; it is not wired, since the task was the
  registration form rather than the whole site.
- Fonts are close approximations of the InnovateUS typefaces, not guaranteed exact.