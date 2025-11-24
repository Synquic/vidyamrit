"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  //   FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Simple math captcha component
function Captcha({ onValidChange }: { onValidChange: (v: boolean) => void }) {
  const [a, b] = useMemo(() => {
    const x = Math.floor(1 + Math.random() * 8);
    const y = Math.floor(1 + Math.random() * 8);
    return [x, y];
  }, []);
  const [value, setValue] = useState("");
  const isValid = Number.parseInt(value, 10) === a + b;

  return (
    <div className="flex items-end gap-3">
      <div>
        <Label htmlFor="captcha" className="text-sm">
          Captcha
        </Label>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            What is {a} + {b}?
          </div>
        </div>
        <Input
          id="captcha"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, "");
            setValue(v);
            onValidChange(Number.parseInt(v, 10) === a + b);
          }}
          className="mt-2 w-28"
          placeholder="Answer"
          aria-describedby="captcha-help"
        />
      </div>
      {isValid && (
        <div className="flex items-center text-green-600 text-sm gap-1">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Verified
        </div>
      )}
    </div>
  );
}

function SuccessMessage({
  title,
  email,
  onClose,
}: {
  title: string;
  email?: string;
  onClose?: () => void;
}) {
  return (
    <div className="rounded-lg border bg-background p-4 md:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-green-100 p-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          {email ? (
            <p className="text-sm text-muted-foreground mt-1">
              We have shared an email regarding your request at{" "}
              <span className="font-medium">{email}</span>. Your profile is
              under review. You will be notified by email when approved.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              Thanks for reaching out. We’ll get back to you shortly.
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <a href="/" className="text-sm underline">
              Go to home
            </a>
            {onClose ? (
              <button onClick={onClose} className="text-sm underline">
                Submit another response
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// const mentorSchema = z.object({
//   firstName: z.string().min(2, "First name required"),
//   lastName: z.string().min(2, "Last name required"),
//   email: z.string().email("Invalid email"),
//   phone: z.string().min(8, "Phone required"),
//   city: z.string().min(2, "City required"),
//   state: z.string().min(2, "State required"),
//   pincode: z.string().min(4, "Pincode required"),
//   education: z.string().min(2, "Education required"),
//   experience: z.string().optional(),
// });

// function MentorForm() {
//   const [captchaOk, setCaptchaOk] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const form = useForm<z.infer<typeof mentorSchema>>({
//     resolver: zodResolver(mentorSchema),
//     defaultValues: {
//       firstName: "",
//       lastName: "",
//       email: "",
//       phone: "",
//       city: "",
//       state: "",
//       pincode: "",
//       education: "",
//       experience: "",
//     },
//   });
//   if (submitted)
//     return (
//       <SuccessMessage
//         title="Mentor request received!"
//         email={form.getValues("email")}
//         onClose={() => setSubmitted(false)}
//       />
//     );
//   function onSubmit(_values: z.infer<typeof mentorSchema>) {
//     if (!captchaOk) return;
//     setSubmitted(true);
//   }
//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <FormField
//             control={form.control}
//             name="firstName"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>First name</FormLabel>
//                 <FormControl>
//                   <Input {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="lastName"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Last name</FormLabel>
//                 <FormControl>
//                   <Input {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <FormField
//             control={form.control}
//             name="email"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Email</FormLabel>
//                 <FormControl>
//                   <Input type="email" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="phone"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Phone</FormLabel>
//                 <FormControl>
//                   <Input inputMode="tel" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//           <FormField
//             control={form.control}
//             name="city"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>City/Town</FormLabel>
//                 <FormControl>
//                   <Input {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="state"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>State</FormLabel>
//                 <FormControl>
//                   <Input {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="pincode"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Pincode</FormLabel>
//                 <FormControl>
//                   <Input inputMode="numeric" pattern="[0-9]*" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>
//         <FormField
//           control={form.control}
//           name="education"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Education qualification</FormLabel>
//               <FormControl>
//                 <Input {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name="experience"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Prior experience (optional)</FormLabel>
//               <FormControl>
//                 <Textarea
//                   placeholder="Teaching, volunteering, facilitation, etc."
//                   {...field}
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <div className="pt-2">
//           <Captcha onValidChange={setCaptchaOk} />
//         </div>
//         <Button
//           type="submit"
//           disabled={!captchaOk}
//           className={cn(
//             "w-full sm:w-auto",
//             !captchaOk && "opacity-70 cursor-not-allowed"
//           )}
//         >
//           Submit mentor request
//         </Button>
//         <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
//           <Mail className="h-3.5 w-3.5" /> You’ll receive review updates by
//           email.
//         </p>
//       </form>
//     </Form>
//   );
// }

// const schoolSchema = z.object({
//   schoolName: z.string().min(2, "School name required"),
//   adminName: z.string().min(2, "Admin name required"),
//   email: z.string().email("Invalid email"),
//   phone: z.string().min(8, "Phone required"),
//   city: z.string().min(2, "City required"),
//   state: z.string().min(2, "State required"),
//   pincode: z.string().min(4, "Pincode required"),
//   qualification: z.string().min(2, "Qualification required"),
// });

// function SchoolForm() {
//   const [captchaOk, setCaptchaOk] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const form = useForm<z.infer<typeof schoolSchema>>({
//     resolver: zodResolver(schoolSchema),
//     defaultValues: {
//       schoolName: "",
//       adminName: "",
//       email: "",
//       phone: "",
//       city: "",
//       state: "",
//       pincode: "",
//       qualification: "",
//     },
//   });
//   if (submitted)
//     return (
//       <SuccessMessage
//         title="School registration received!"
//         email={form.getValues("email")}
//         onClose={() => setSubmitted(false)}
//       />
//     );
//   function onSubmit(_values: z.infer<typeof schoolSchema>) {
//     if (!captchaOk) return;
//     setSubmitted(true);
//   }
//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <FormField
//             control={form.control}
//             name="schoolName"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>School name</FormLabel>
//                 <FormControl>
//                   <Input {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="adminName"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Your name (principal/admin)</FormLabel>
//                 <FormControl>
//                   <Input {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <FormField
//             control={form.control}
//             name="email"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Email</FormLabel>
//                 <FormControl>
//                   <Input type="email" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="phone"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Phone</FormLabel>
//                 <FormControl>
//                   <Input inputMode="tel" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//           <FormField
//             control={form.control}
//             name="city"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>City/Town</FormLabel>
//                 <FormControl>
//                   <Input {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="state"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>State</FormLabel>
//                 <FormControl>
//                   <Input {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="pincode"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Pincode</FormLabel>
//                 <FormControl>
//                   <Input inputMode="numeric" pattern="[0-9]*" {...field} />
//                 </FormControl>
//                 <FormMessage />
//               </FormItem>
//             )}
//           />
//         </div>
//         <FormField
//           control={form.control}
//           name="qualification"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>School qualification details</FormLabel>
//               <FormControl>
//                 <Textarea
//                   placeholder="Student count, grades, needs, facilities, etc."
//                   {...field}
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <p className="text-xs text-muted-foreground">
//           Process: 1) Register school 2) Submit qualification data 3) If
//           qualified, a mentor will conduct baseline assessments 4) Upon approval
//           cohorts are formed and mentors begin sessions.
//         </p>
//         <div className="pt-2">
//           <Captcha onValidChange={setCaptchaOk} />
//         </div>
//         <Button
//           type="submit"
//           disabled={!captchaOk}
//           className={cn(
//             "w-full sm:w-auto",
//             !captchaOk && "opacity-70 cursor-not-allowed"
//           )}
//         >
//           Submit school registration
//         </Button>
//       </form>
//     </Form>
//   );
// }

const inquirySchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  message: z.string().min(2, "Message required"),
});

function InquiryForm() {
  const [captchaOk, setCaptchaOk] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<z.infer<typeof inquirySchema>>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });
  if (submitted)
    return (
      <SuccessMessage
        title="Thanks for your enquiry!"
        onClose={() => setSubmitted(false)}
      />
    );
  function onSubmit(_values: z.infer<typeof inquirySchema>) {
    if (!captchaOk) return;
    setSubmitted(true);
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="How would you like to support, partner, or learn more?"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-2">
          <Captcha onValidChange={setCaptchaOk} />
        </div>
        <Button
          type="submit"
          disabled={!captchaOk}
          className={cn(
            "w-full sm:w-auto",
            !captchaOk && "opacity-70 cursor-not-allowed"
          )}
        >
          Send enquiry
        </Button>
      </form>
    </Form>
  );
}

export default function SupportPage() {
  // const [mentorOpen, setMentorOpen] = useState(false);
  // const [schoolOpen, setSchoolOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <section className="px-4 py-10 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-amber-700 tracking-tight text-balance">
            Support Vidyamrit
          </h1>
          <p className="mt-4 text-gray-700 text-pretty">
            Together we can ensure every child is equipped with literacy,
            learning, and livelihood skills. Choose how you’d like to help
            below.
          </p>
        </div>

        <div className="max-w-5xl mx-auto mt-8 grid grid-cols-1 gap-6 md:gap-8">
          {/* Mentor card */}
          {/* <Card className="border-0 shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="md:grid md:grid-cols-5 md:gap-6 md:items-center">
                <div className="md:col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-amber-700" />
                    </div>
                    <h2 className="font-serif text-2xl font-semibold">
                      Register as Mentor
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Help educate and uplift by teaching in schools, conducting
                    baseline tests, and mentoring students. Anyone can be a
                    mentor—training and materials are provided.
                  </p>
                  <ul className="mt-3 text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Go on-ground to teach and facilitate learning</li>
                    <li>Conduct baseline assessments and track progress</li>
                    <li>Receive training, curriculum, and ongoing support</li>
                  </ul>
                  <div className="mt-5">
                    <Button
                      id="mentor-toggle"
                      aria-haspopup="dialog"
                      onClick={() => setMentorOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      Register as mentor
                    </Button>
                  </div>
                </div>
                <div className="md:col-span-2 mt-5 md:mt-0">
                  <img
                    src="/mentor-teaching-in-class.png"
                    alt="Mentor teaching students in a classroom"
                    width={640}
                    height={500}
                    className="w-full h-48 md:h-44 object-cover rounded-lg"
                  />
                </div>
              </div>

              <Dialog open={mentorOpen} onOpenChange={setMentorOpen}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Register as Mentor</DialogTitle>
                  </DialogHeader>
                  <MentorForm />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card> */}

          {/* School card */}
          {/* <Card className="border-0 shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="md:grid md:grid-cols-5 md:gap-6 md:items-center">
                <div className="md:col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-red-600" />
                    </div>
                    <h2 className="font-serif text-2xl font-semibold">
                      Add School
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    If you are a principal or school representative: register
                    your school. After review and qualification, our mentors
                    will conduct baseline assessments and begin cohorts.
                  </p>
                  <ol className="mt-3 text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                    <li>Register school</li>
                    <li>Submit qualification data</li>
                    <li>Baseline assessment by mentor</li>
                    <li>Cohorts formed and sessions begin</li>
                  </ol>
                  <div className="mt-5">
                    <Button
                      id="school-toggle"
                      aria-haspopup="dialog"
                      onClick={() => setSchoolOpen(true)}
                      className="w-full sm:w-auto"
                      variant="default"
                    >
                      Register your school
                    </Button>
                  </div>
                </div>
                <div className="md:col-span-2 mt-5 md:mt-0">
                  <img
                    src="/school-with-students.png"
                    alt="Students gathered at school assembly"
                    width={640}
                    height={500}
                    className="w-full h-48 md:h-44 object-cover rounded-lg"
                  />
                </div>
              </div>

              <Dialog open={schoolOpen} onOpenChange={setSchoolOpen}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Register School</DialogTitle>
                    <DialogDescription>
                      After review and qualification, we’ll coordinate a mentor
                      baseline assessment and form cohorts.
                    </DialogDescription>
                  </DialogHeader>
                  <SchoolForm />
                  <DialogFooter className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      You’ll receive updates by email during review.
                    </p>
                    <DialogClose asChild>
                      <Button type="button" variant="ghost">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card> */}

          {/* Inquiry card */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="md:grid md:grid-cols-5 md:gap-6 md:items-center">
                <div className="md:col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Info className="h-5 w-5 text-amber-700" />
                    </div>
                    <h2 className="font-serif text-2xl font-semibold">
                      General Enquiry
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Have another way to support our mission or want to explore
                    partnerships? Send us a note and we’ll get back soon.
                  </p>
                  <div className="mt-5">
                    <Button
                      id="inquiry-toggle"
                      aria-haspopup="dialog"
                      onClick={() => setInquiryOpen(true)}
                      className="w-full sm:w-auto"
                      variant="default"
                    >
                      Send an enquiry
                    </Button>
                  </div>
                </div>
                <div className="md:col-span-2 mt-5 md:mt-0">
                  <img
                    src="/contact-us.png"
                    alt="Community support and outreach illustration"
                    width={640}
                    height={500}
                    className="w-full h-48 md:h-44 object-cover rounded-lg"
                  />
                </div>
              </div>

              <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>General Enquiry</DialogTitle>
                    <DialogDescription>
                      Share how you’d like to support, partner, or learn more.
                      We’ll reply shortly.
                    </DialogDescription>
                  </DialogHeader>
                  <InquiryForm />
                  <DialogFooter className="flex items-center justify-end">
                    <DialogClose asChild>
                      <Button type="button" variant="ghost">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto text-center mt-12">
          <p className="text-sm text-muted-foreground">
            By submitting, you agree to being contacted regarding your interest.
            Accounts are created only after manual approval by our admin team.
          </p>
        </div>
      </section>
    </main>
  );
}
