// Public privacy policy. The URL for this page is what gets submitted to the
// Play Console (App content -> Privacy policy), and the #data-deletion anchor
// is what gets submitted as the data deletion URL.
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ShieldCheck, Trash2 } from "lucide-react";

const LAST_UPDATED = "27 July 2026";
const CONTACT_EMAIL = "connect@vidyamrit.in";

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      <div className="space-y-4 text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50 to-white">
      <PublicNavbar />

      <header className="px-4 pt-12 pb-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 mb-5">
            <ShieldCheck className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Privacy Policy
          </h1>
          <p className="text-gray-600">Last updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <main className="px-4 pb-16">
        <div className="max-w-3xl mx-auto space-y-10">
          <Section title="Who we are">
            <p>
              Vidyamrit ("we", "us") runs a foundational literacy and numeracy
              programme in government schools in India. This policy explains what
              personal information the Vidyamrit application and website collect,
              why we collect it, and what choices you have.
            </p>
            <p>
              We are based in Indore, Madhya Pradesh, India. You can reach us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-amber-700 font-medium hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="Who uses this application">
            <p>
              The Vidyamrit application is a programme management tool used by
              adults working with our programme — tutors, volunteers,
              administrators, and school or government stakeholders who have been
              given read-only access. Accounts are created by Vidyamrit
              administrators; the application does not offer public sign-up.
            </p>
            <p>
              <strong>The application is not intended for use by children.</strong>{" "}
              Children participate in the programme offline, and our staff record
              their learning progress in the application on their behalf.
            </p>
          </Section>

          <Section title="Information we collect">
            <p className="font-medium text-gray-900">
              1. Account information (about our staff and volunteers)
            </p>
            <p>
              Name, email address, phone number, assigned role, assigned school,
              an optional profile photo, and account validity status. Passwords
              are handled by Google Firebase Authentication and are never stored
              on our servers.
            </p>

            <p className="font-medium text-gray-900">
              2. Student records (about children in the programme, entered by our
              staff)
            </p>
            <p>
              Name, age, gender, class and roll number. Where a school provides
              them, we may also record an Aadhaar number, an APAAR ID, caste
              category, and a contact mobile number. We record guardian details
              (name, relationship, occupation, phone number), and the child's
              assessment results, learning levels, attendance and progress notes.
            </p>

            <p className="font-medium text-gray-900">3. School information</p>
            <p>
              School name, UDISE code, address, city, state, block, PIN code,
              school type and level, year of establishment, and the name and phone
              number of the school's point of contact.
            </p>

            <p className="font-medium text-gray-900">
              4. Volunteer applications (submitted through our public form)
            </p>
            <p>
              Name, email address, phone number, city, state, PIN code,
              educational background, and any experience or motivation you choose
              to share.
            </p>

            <p className="font-medium text-gray-900">5. Technical information</p>
            <p>
              Our servers keep access logs that include your IP address, browser
              and device information (user agent), the pages or endpoints
              requested, and the date and time of the request. These logs help us
              keep the service running and secure.
            </p>
          </Section>

          <Section title="What we do not collect">
            <p>
              We want to be specific about this. The Vidyamrit application
              contains <strong>no advertising or analytics software</strong>. We do
              not collect advertising identifiers, we do not track your location,
              we do not access your camera, microphone, contacts, photos, call
              logs or messages, and we do not build advertising profiles. We do
              not sell personal information to anyone.
            </p>
          </Section>

          <Section title="Why we collect this information">
            <ul className="list-disc pl-6 space-y-2">
              <li>
                To assess each child's current learning level and place them in an
                appropriate learning group.
              </li>
              <li>
                To record attendance and track learning progress over time so
                tutors can support children who are falling behind.
              </li>
              <li>
                To produce progress reports for schools, our team, and government
                or funding stakeholders.
              </li>
              <li>
                To create and manage staff and volunteer accounts, and to control
                who can see which information.
              </li>
              <li>
                To respond to volunteer applications and programme enquiries.
              </li>
              <li>
                To keep the service secure, diagnose faults, and prevent misuse.
              </li>
            </ul>
          </Section>

          <Section title="Children's information">
            <p>
              Records about children are collected in partnership with the child's
              school as part of a school education programme. We collect only what
              is needed to run the programme and to report on it.
            </p>
            <p>
              Aadhaar number, APAAR ID and caste category are optional fields. We
              record them only where a school shares them with us for programme
              enrolment or government reporting, and they are visible only to
              staff assigned to that school and to Vidyamrit administrators.
            </p>
            <p>
              Access is restricted by role: a tutor can see only the children in
              their assigned school, and stakeholder accounts receive limited,
              read-only summaries.
            </p>
            <p>
              If you are a parent or guardian and you want to see, correct, or
              remove your child's records, please write to us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-amber-700 font-medium hover:underline"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              and we will help you.
            </p>
          </Section>

          <Section title="Who we share information with">
            <p>
              We do not sell personal information and we do not share it for
              advertising. We share information only with service providers who
              help us operate the application, and only to the extent they need it:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Google Firebase Authentication</strong> — manages sign-in
                and passwords.
              </li>
              <li>
                <strong>Our database and hosting providers</strong> — store
                programme data and run our servers.
              </li>
              <li>
                <strong>Our email delivery provider</strong> — sends
                notifications, such as volunteer application updates.
              </li>
            </ul>
            <p>
              We may also disclose information where we are required to do so by
              law, or to a school or government department as part of the
              programme's official reporting.
            </p>
          </Section>

          <Section title="How we protect information">
            <p>
              All traffic between the application and our servers is encrypted
              using HTTPS. Access to the application requires a password, and what
              each account can see is limited by its assigned role. Access to our
              servers and database is restricted to authorised members of our team.
            </p>
            <p>
              No system can be guaranteed completely secure, but we work to
              protect this information and to correct problems promptly when we
              find them.
            </p>
          </Section>

          <Section title="How long we keep information">
            <p>
              We keep student and programme records for as long as the child is
              enrolled in the programme, and afterwards where we need them for
              programme reporting, evaluation, or to meet obligations to schools
              and funders. Staff and volunteer account information is kept while
              the account is active.
            </p>
            <p>
              Server access logs are kept for a limited period for security and
              troubleshooting. When information is no longer needed, we delete it
              or remove the details that identify a person.
            </p>
          </Section>

          <Section id="data-deletion" title="Your rights and data deletion">
            <Card className="border-amber-200 bg-amber-50/60">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-serif text-lg font-bold text-gray-900 mb-2">
                      How to request account or data deletion
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      Email{" "}
                      <a
                        href={`mailto:${CONTACT_EMAIL}?subject=Data%20deletion%20request`}
                        className="text-amber-700 font-medium hover:underline"
                      >
                        {CONTACT_EMAIL}
                      </a>{" "}
                      with the subject line{" "}
                      <span className="font-medium">
                        "Data deletion request"
                      </span>
                      . Tell us your name and the email address on the account, or
                      — if you are a parent or guardian — the child's name, class
                      and school.
                    </p>
                  </div>
                </div>

                <div className="pl-8 space-y-2 text-gray-700">
                  <p className="font-medium text-gray-900">What happens next</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      We confirm your request within 7 days and may ask for
                      details to verify your identity.
                    </li>
                    <li>
                      We complete verified deletion requests within 30 days.
                    </li>
                    <li>
                      Account deletion removes the sign-in account and personal
                      profile details.
                    </li>
                    <li>
                      Where we are required to retain certain programme or
                      reporting records, we will tell you what we must keep, why,
                      and for how long.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <p>You may also ask us to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                tell you what personal information we hold about you or your
                child, and give you a copy;
              </li>
              <li>correct information that is wrong or out of date;</li>
              <li>
                withdraw a consent you previously gave, where our use of the
                information relies on that consent.
              </li>
            </ul>
            <p>
              To make any of these requests, write to{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-amber-700 font-medium hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              . If you are unhappy with how we have handled your request, tell us
              and we will look at it again.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              If we change this policy we will update the date at the top of this
              page. Where the change is significant, we will also make it clear
              inside the application.
            </p>
          </Section>

          <Section title="Contact us">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Vidyamrit</p>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-amber-700 hover:underline"
                    >
                      {CONTACT_EMAIL}
                    </a>
                    <p className="text-sm text-gray-600">
                      Indore, Madhya Pradesh, India
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
