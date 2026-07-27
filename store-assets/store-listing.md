# Play Store listing — copy & assets

Everything needed for **Play Console → Store presence → Main store listing**,
plus the **App access** section which is easy to miss and will get the app
rejected if skipped.

---

## 🚨 READ THIS FIRST — App access / demo account

**This is a hard blocker and it is not part of the store listing.**

Vidyamrit requires a login, and there is no public sign-up. A Google reviewer
who opens the app sees only a login screen. If they cannot get in, the app is
rejected with *"we were unable to review your app"*.

**Fix:** Play Console → **App content → App access** → select
*"All or some functionality is restricted"* → add credentials.

### What to provide

| Field | Value |
|---|---|
| Name of instructions | `Tutor login` |
| Any other info | See the note below |
| Username | *demo account email* |
| Password | *demo account password* |

Suggested note for the reviewer:

```
Vidyamrit is a programme management tool for adult staff (tutors, volunteers
and administrators) running a school literacy programme. Accounts are created
by Vidyamrit administrators; there is no public sign-up.

Sign in with the credentials above to reach the tutor dashboard. From there you
can open Students, Groups, Baseline Tests, Attendance and Reports.

This demo account is attached to a sample school containing test records only.
```

### ⚠️ Do NOT point the reviewer at real data

Create a **dedicated demo school with fictional students**. Do not give a
reviewer an account that can see real children's names, Aadhaar numbers, caste
or guardian phone numbers.

Setup: super-admin creates a school (e.g. "Demo Public School"), adds 5–10
fictional students, creates a group, and a tutor account assigned to that school.
The demo account should be a **tutor**, not a super-admin — a tutor only sees
its own school ([permissions.ts](pwa/src/routes/permissions.ts)).

Keep this account active permanently — Google re-checks it on every update.

---

## App details

| Field | Value |
|---|---|
| App name (max 30) | `Vidyamrit` |
| Category | Education |
| Tags | Education, Productivity |
| Contact email | `connect@vidyamrit.in` |
| Website | `https://vidyamrit.in` |
| Phone | optional — `+91 9098304802` is already public in the site footer |
| Privacy policy | `https://vidyamrit.synquic.in/privacy` |

---

## Short description (max 80 characters)

**Recommended** — 74 characters:

```
Foundational literacy tracking for tutors and volunteers in Indian schools
```

Alternatives:

```
Assessment, attendance and progress tracking for school literacy programmes
```
```
Programme management for foundational literacy and numeracy in schools
```

---

## Full description (max 4000 characters)

```
Vidyamrit is the programme management app used by tutors, volunteers and
administrators running Vidyamrit's foundational literacy and numeracy programme
in Indian government schools.

This app is a work tool for programme staff. It is not a learning app for
children — children take part in sessions in person, and staff record their
progress here.

WHAT YOU CAN DO

Baseline assessment
Run an adaptive reading or numeracy assessment that adjusts question difficulty
as a child answers, and settles on the level that reflects what they can
actually do. Supports multiple-choice, one-word answer and spoken-answer
questions marked by the tutor.

Level-based learning groups
Place children into groups by assessed level so teaching is pitched correctly.
Groups can be generated from assessment results or managed by hand.

Daily attendance
Mark attendance for a group in a few taps, by date and by subject, with an
optional note. Designed to be quick on a phone in a classroom.

Progress tracking
Track how long a group spends on each level against the programme plan, mark
teaching days, adjust level durations when a group needs longer, and record
holidays. Each child carries a progress status so tutors can spot who needs
extra help.

Level assessments
Test a group at the end of a level and move children forward, either
automatically or with tutor approval depending on the school's settings.

Reports
See level distribution across a school, individual progress reports for a child,
and programme-wide summaries.

Programme builder
Administrators can define programmes level by level — objectives, expected
duration, teaching resources and the assessment questions for each level.

Stakeholder views
Create limited, read-only dashboards for principals, block or district
coordinators and other partners, scoped to only the schools they should see.

Works in Hindi and English
Switch language at any time.

WHO USES THIS APP

Tutors — run assessments, mark attendance and track their groups
Volunteers — support sessions and assessments with time-limited access
Administrators — manage schools, staff, students and programmes
Stakeholders — view read-only progress summaries for their area

ACCESS

Accounts are created by Vidyamrit administrators. There is no public sign-up.
If you would like to volunteer with the programme, apply through
https://vidyamrit.in

PRIVACY

Vidyamrit contains no advertising and no third-party analytics. We do not sell
personal information. Read our privacy policy at
https://vidyamrit.synquic.in/privacy

ABOUT VIDYAMRIT

Vidyamrit works to give India's underserved children the foundational skills
they need — reading, numeracy, digital literacy and communication — starting in
government schools in Indore, Madhya Pradesh.

Literacy. Learning. Livelihood.
```

*(Roughly 2,400 characters — comfortably inside the 4,000 limit.)*

---

## Graphic assets

| Asset | Spec | Status |
|---|---|---|
| App icon | 512×512 PNG, opaque, <1 MB | ✅ `store-assets/play-icon-512.png` (133 KB) |
| Alternative icon | mark only, no wordmark | ✅ `store-assets/play-icon-512-mark.png` — cleaner at very small sizes |
| Feature graphic | 1024×500 PNG/JPG, no alpha | ❌ **to do** |
| Phone screenshots | 2–8 images, 16:9 or 9:16, min 320 px, max 3840 px | ❌ **to do** |
| Tablet screenshots | optional | skip |

### Which icon to use

`play-icon-512.png` matches the launcher icon already shipped in the app, so the
Play listing and the phone home screen look like the same product. **Use this one.**

`play-icon-512-mark.png` drops the "VIDYAMRIT" wordmark. Text is unreadable at
the ~48 px size Play uses in search results, so the mark-only version is
technically the better icon — but it will not match the launcher icon until that
is regenerated too. Only switch if you are willing to redo both.

### Feature graphic (1024×500)

Appears at the top of the store listing. Suggested treatment:

- Background `#0C252A` (the brand teal, same as the icon)
- Vidyamrit mark on the left, white
- To the right: **"Literacy. Learning. Livelihood."**
- Optionally a smaller line: *Foundational literacy programme management*
- No screenshots inside it, no small text — it gets heavily scaled down

### Screenshots — capture these five

Use the demo school so no real child's data appears in a public listing.

1. **Login screen** — shows branding
2. **Tutor dashboard** — the landing view after sign-in
3. **Students list** — core record keeping
4. **Attendance marking** — the strongest "this is useful" screen
5. **Reports / level distribution** — charts read well in a listing

How to capture: open the release APK on a phone, press Power + Volume Down.
Or run in an emulator at 1080×1920 for consistent sizing.

⚠️ Check every screenshot before uploading — no real names, no Aadhaar numbers,
no phone numbers.

---

## Content rating questionnaire

Answer honestly; expected outcome is an *Everyone / 3+* style rating.

| Question | Answer |
|---|---|
| Violence | No |
| Sexual content | No |
| Profanity | No |
| Drugs, alcohol, tobacco | No |
| Gambling | No |
| Users can interact / communicate with each other | **No** — there is no chat or user-to-user messaging |
| Shares user location | No |
| Allows purchase of digital goods | No |
| Contains user-generated content shared publicly | **No** — records are visible only to authorised staff |

---

## Final submission checklist

- [ ] **App access — demo tutor credentials added** ← most-missed blocker
- [ ] Demo school with fictional students created
- [ ] Privacy policy URL: `https://vidyamrit.synquic.in/privacy`
- [ ] Data deletion URL: `https://vidyamrit.synquic.in/privacy#data-deletion`
- [ ] Data safety form completed — see [PLAY_STORE_DATA_SAFETY.md](../PLAY_STORE_DATA_SAFETY.md)
- [ ] Target audience set to **18 and over**
- [ ] Ads: **No ads**
- [ ] Content rating questionnaire submitted
- [ ] App icon 512×512 uploaded
- [ ] Feature graphic 1024×500 uploaded
- [ ] At least 2 phone screenshots uploaded
- [ ] Short + full description filled
- [ ] AAB uploaded to Production
- [ ] Play App Signing accepted
- [ ] Submit for review
