# Play Console — Data Safety answer sheet

Reference for filling **Play Console → App content → Data safety**.
Every answer below was derived from the actual code, with the source file noted.

> **Keep this file updated.** If a model gains a field that collects personal
> information, the Data Safety declaration must be updated too — Google treats a
> stale or inaccurate declaration as a policy violation.

---

## 0. Before you start — one thing to understand

Google's form asks what your app *collects*. Two points that trip people up:

**1. "Shared" has a narrow meaning.** Transferring data to a *service provider*
(Firebase, your database host, your email provider) is **not** "sharing".
Sharing means giving it to a third party who uses it for their own purposes.
So for almost everything below, **Shared = No**.

**2. Students are not users of this app, but their data still gets declared.**
Only adults log in. Staff type in information *about* children. Google's form
covers personal information the app collects, including information a user
provides about other people — so student records are in scope. Under-declaring
is what gets apps suspended, so we declare them.

---

## 1. Global answers

| Question | Answer | Why |
|---|---|---|
| Is all data encrypted in transit? | **Yes** | HTTPS everywhere; `androidScheme: 'https'` in [capacitor.config.ts](pwa/capacitor.config.ts) |
| Do you provide a way for users to request data deletion? | **Yes** | `https://vidyamrit.synquic.in/privacy#data-deletion` |
| Does your app contain ads? | **No** | No ad SDK anywhere — verified |
| Do you use third-party analytics? | **No** | Only `firebase/app` + `firebase/auth` are imported. No GA, Firebase Analytics, Sentry, Mixpanel, etc. |
| Data collection required or optional? | **Mostly required** | See per-field notes; Aadhaar / APAAR / caste are optional |

---

## 2. Category overview — the quick pass

| Google category | Collected? | Note |
|---|---|---|
| **Location** (approximate / precise) | ❌ No | No GPS, no location API. City/state are *typed in*, which is not the Location category |
| **Personal info** | ✅ **Yes** | See §3 — the main section |
| **Financial info** | ❌ No | No payments anywhere |
| **Health and fitness** | ❌ No | — |
| **Messages** | ❌ No | App does not read email/SMS |
| **Photos and videos** | ✅ **Yes** | Admin-uploaded question images ([ManagePrograms.tsx](pwa/src/pages/dashboard/ManagePrograms.tsx#L1697)) |
| **Audio files** | ❌ No | Verbal assessments are marked by a human; nothing is recorded |
| **Files and docs** | ❌ No | Only images, covered above |
| **Calendar** | ❌ No | — |
| **Contacts** | ❌ **No** | ⚠️ Guardian phone numbers are *typed in* — the app never reads the device contact list. This belongs under Personal info → Phone number |
| **App activity** | ✅ **Yes** | Assessment answers, attendance, progress notes |
| **Web browsing** | ❌ No | — |
| **App info and performance** | ✅ **Yes** | Server access logs |
| **Device or other IDs** | ⚠️ Decide | See §5 (IP address question) |

---

## 3. Personal info — detailed declarations

For every row: **Collected = Yes**, **Shared = No**, **Ephemeral = No**,
**Purpose = App functionality** unless stated otherwise.

### Name — ✅ Collected, Required
Staff names ([UserModel](backend/src/models/UserModel.ts)), student names and
guardian names ([StudentModel](backend/src/models/StudentModel.ts)), school
contact person ([SchoolModel](backend/src/models/SchoolModel.ts)), volunteer
applicant names ([VolunteerRequestModel](backend/src/models/VolunteerRequestModel.ts)).
**Purposes:** App functionality, Account management

### Email address — ✅ Collected, Required
Staff sign-in ([UserModel](backend/src/models/UserModel.ts)), volunteer
applications, view-user accounts ([ViewModel](backend/src/models/ViewModel.ts)).
**Purposes:** App functionality, Account management, Developer communications
*(notification emails via [emailService.ts](backend/src/utils/emailService.ts))*

### Phone number — ✅ Collected, Required
Staff `phoneNo`, student `mobileNumber`, guardian `contactInfo[].phone_no`,
school `phone`, volunteer applicant `phoneNumber`.
**Purposes:** App functionality

### User IDs — ✅ Collected, Required
Firebase UID, MongoDB document IDs, student `roll_no`.
**Also, and importantly:** `aadharNumber` and `apaarId`
([StudentModel](backend/src/models/StudentModel.ts#L137-L138)) — **government
identifiers**. Mark these as **Optional** (they are only recorded when a school
supplies them).
**Purposes:** App functionality

### Address — ✅ Collected, Required
School `address` / `pinCode`, volunteer applicant `city` / `state` / `pincode`.
All of these are `required: true` in their schemas, so declare **Required**, not
Optional.
**Purposes:** App functionality

### 🚨 Race and ethnicity — ✅ Collected, Optional
**This is the declaration most likely to be missed, and the most important one
to get right.**

[StudentModel](backend/src/models/StudentModel.ts#L143) has a `caste` field.
Caste is a sensitive social category and maps to Google's
**"Race and ethnicity"** bucket. It is also captured in
[ViewModel](backend/src/models/ViewModel.ts) filters.

Declare it. Mark **Optional**. Expect Google to look more closely at the app
because of it — that is normal and fine, as long as the declaration is honest and
the privacy policy explains it (ours does).

**Purposes:** App functionality

> If Vidyamrit does not actually need caste data, **deleting the field is the
> cleanest option** — it removes a sensitive declaration entirely. Worth a
> conversation with the programme team.

### Other info — ✅ Collected, Required
Student `age`, `gender`, `class`; guardian `relation` and `occupation`;
volunteer `education` / `experience` / `motivation`; school metadata
(`udise_code`, `type`, `level`, `establishedYear`, `block`).
**Purposes:** App functionality

### Not collected
- Political or religious beliefs — **No**
- Sexual orientation — **No** *(`gender` is not sexual orientation)*
- Credit / payment info — **No**

---

## 4. Other categories

### App activity → Other user-generated content — ✅ Collected, Required
Assessment answers and scores
([ProgramAssessmentModel](backend/src/models/ProgramAssessmentModel.ts)),
attendance records including free-text `notes`
([AttendanceModel](backend/src/models/AttendanceModel.ts)), progress flags and
reasons, level-assessment history
([CohortModel](backend/src/models/CohortModel.ts)).
**Purposes:** App functionality

### Photos and videos → Photos — ✅ Collected, Optional
Question images uploaded by super-admins via
[ManagePrograms.tsx](pwa/src/pages/dashboard/ManagePrograms.tsx#L1697) →
`POST /uploads/question-image`. Stored server-side under `/uploads`.
`UserModel.profilePhoto` also exists.

These are curriculum images, not personal photos — but they are user-uploaded
files, so declare them.
**Purposes:** App functionality

### App info and performance → Diagnostics — ✅ Collected, Required
[httpLogger.ts](backend/src/utils/logger/httpLogger.ts) uses morgan
`'combined'`, which writes **IP address, user agent, requested URL, status code
and timestamp** to `http.log` and `full.log`.
**Purposes:** Fraud prevention, security, and compliance

---

## 5. ⚠️ Three judgment calls — you decide these

### A. IP address → declare under "Device or other IDs"?

Google exempts data processed **only ephemerally**. Our IP addresses are
**written to disk** in server logs, so they are not ephemeral.

- **Recommended: declare it.** Category *Device or other IDs*, purpose *Fraud
  prevention, security and compliance*. Over-declaring is never penalised;
  under-declaring is.
- Alternative: cap log retention and treat as security-only. Riskier.

### B. Is reporting to schools / government "sharing"?

The privacy policy says data may go to a school or government department as
part of official programme reporting.

- If you **export or hand over student-level reports** to a school or government
  body → that is **Sharing**. Declare it, purpose *App functionality*.
- If stakeholders only **log in and view aggregate summaries** inside the app
  (which is what [ViewModel](backend/src/models/ViewModel.ts) does) → that is
  **not** sharing. Declare **Shared = No**.

**Decide based on what actually happens operationally.** Right now the code only
supports in-app viewing, which points to *not sharing* — but confirm nobody is
emailing spreadsheets around.

### C. Should `caste` exist at all?

See §3. If it is not required for programme reporting, removing the field is the
single biggest simplification available to this submission.

---

## 6. Related App content answers

| Section | Recommended answer | Reason |
|---|---|---|
| **Target audience / age** | **18 and over** | Only adults log in — tutors, volunteers, admins. Children participate offline and never use the app |
| **Appeals to children?** | **No** | No child-facing UI, no games, no cartoons |
| **Ads** | **No ads** | Verified — no ad SDK |
| **Content rating** | Answer honestly: no violence, no sexual content, no gambling, no drugs, no user-to-user communication, no location sharing | Expect a **Rated for 3+ / Everyone** style outcome |
| **News app?** | No | — |
| **COVID-19 contact tracing?** | No | — |
| **Data safety — data types for children** | N/A given "18 and over" | Declaring 18+ is what keeps the Families Policy out of scope |
| **Government app?** | No | Independent programme, even though it uses UDISE / APAAR identifiers |

> **The 18+ declaration matters a lot.** It is both accurate and the thing that
> keeps Google's Families Policy from applying. Do not declare a child audience.

---

## 7. Fill order in the Console

1. Data safety → *Data collection and security* → answer the global questions (§1)
2. Data safety → go category by category using §2 as the checklist
3. For each **Yes**, use §3–§4 for collected / shared / required / purposes
4. Resolve the three judgment calls in §5 **before** submitting
5. App content → Target audience, Ads, Content rating (§6)
6. Privacy policy URL: `https://vidyamrit.synquic.in/privacy`
7. Data deletion URL: `https://vidyamrit.synquic.in/privacy#data-deletion`

---

## 8. Honest caveat

This sheet is an accurate map of what the **code** collects, and it follows
Google's Data Safety rules as of **July 2026**. Two things it is not:

- **Not legal advice.** Children's data + Aadhaar + caste under India's DPDP Act
  2023 is worth a real legal review.
- **Not a substitute for the Console's own wording.** Google occasionally
  reorganises the form. If a question here does not match what you see, trust the
  Console and update this file.
