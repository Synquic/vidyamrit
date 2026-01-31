import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Users,
  Target,
  Heart,
  ArrowRight,
  Star,
  Quote,
  Lightbulb,
  TrendingUp,
  FileText,
  Handshake,
} from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import Scroll from "@/components/ui/scroll";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <PublicNavbar />
      {/* Hero Section */}
      <section className="relative px-4 min-h-[calc(100dvh-theme(spacing.16))] flex items-center justify-center">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <div className="mb-6">
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-amber-600 mb-4 tracking-tight">
                Vidyamrit
              </h1>
            </div>
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Literacy. Learning. Livelihood.
            </h2>
            <p className="font-sans text-lg md:text-xl lg:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Empowering India's underserved children from the fundamentals to
              the future. Vidyamrit prepares every child with essential skills,
              genuine opportunity, and unshakeable confidence to excel in life.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105"
              onClick={() => {
                window.location.pathname = "/support";
              }}
            >
              Join the Movement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-amber-500 text-amber-700 hover:bg-amber-50 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 bg-transparent"
              onClick={() => {
                window.location.pathname = "/support";
              }}
            >
              Support a School
              <Heart className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
        {/* Scroll indicator at bottom center */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <a href="#think-tank">
            <Scroll direction="down" msg="learn more" />
          </a>
        </div>
      </section>

      {/* Think Tank Section */}
      <section
        className="py-16 bg-gradient-to-b from-white to-amber-50"
        id="think-tank"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Vidyamrit — A Think Tank for School Education in India
            </h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto mb-8"></div>
            <p className="font-sans text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Beyond direct learning support, Vidyamrit serves as a national
              think tank for school education — driving research, insights, and
              strategies to improve education systems across India.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-12">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50">
              <CardContent className="p-8">
                <h3 className="font-serif text-2xl font-bold text-gray-900 mb-6 text-center">
                  As a thought leader, we:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      icon: TrendingUp,
                      title: "Analyze educational challenges and learning trends",
                      color: "amber",
                    },
                    {
                      icon: FileText,
                      title: "Develop evidence-based policy recommendations",
                      color: "red",
                    },
                    {
                      icon: Handshake,
                      title:
                        "Advise schools, nonprofits, and policymakers on best practices",
                      color: "amber",
                    },
                    {
                      icon: Lightbulb,
                      title:
                        "Foster innovation in pedagogy, assessment, and teaching models",
                      color: "red",
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div
                        className={`bg-${item.color}-100 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 mt-1`}
                      >
                        <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                      </div>
                      <p className="font-sans text-lg text-gray-700 leading-relaxed">
                        {item.title}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="font-sans text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Our research initiatives help shape impactful solutions that
              strengthen the quality and equity of school education in
              communities across the country.
            </p>
          </div>
        </div>
      </section>

      {/* The Challenge Section */}
      <section className="py-16 bg-white" id="about">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Why We Exist
            </h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto mb-8"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-sans text-lg text-gray-700 leading-relaxed mb-6">
                Across India, millions of government school children face daily
                barriers to basic reading and writing, closing doors to brighter
                futures. Many are forced to leave school before high school,
                ending up in unstable, low-wage jobs—and the cycle of poverty
                repeats.
              </p>
              <p className="font-sans text-lg text-gray-700 leading-relaxed">
                In rural and marginalized communities, these hurdles are even
                higher: limited literacy, scarce access to digital skills, and
                almost no career guidance.
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-amber-50 p-8 rounded-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    30K+
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Children across 40+ government schools in Indore
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    50%
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Drop out before high school
                  </div>
                  <div className="text-xs text-gray-500 italic">
                    ~15K children
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    70%
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Cannot read at grade level
                  </div>
                  <div className="text-xs text-gray-500 italic">
                    ~21K children
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    90%
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Lack digital literacy
                  </div>
                  <div className="text-xs text-gray-500 italic">
                    ~27K children
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section
        className="py-16 bg-gradient-to-b from-amber-50 to-white"
        id="approach"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              The Vidyamrit Way
            </h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto mb-8"></div>
            <p className="font-sans text-xl text-gray-700 max-w-3xl mx-auto">
              We believe education is the greatest force for breaking the cycle
              of poverty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Foundational Literacy & Numeracy",
                description:
                  "Every child reading, writing, and understanding at grade level.",
                icon: BookOpen,
                color: "amber",
              },
              {
                title: "Digital Literacy",
                description:
                  "Safe, confident use of technology for real-world success.",
                icon: Target,
                color: "red",
              },
              {
                title: "Communication Skills",
                description:
                  "Practical English speaking, reading, and comprehension for global opportunities.",
                icon: Users,
                color: "amber",
              },
              {
                title: "STEM & Creative Thinking",
                description:
                  "Hands-on, curiosity-driven projects that ignite innovation and problem-solving.",
                icon: Star,
                color: "red",
              },
              {
                title: "Career & Scholarship Guidance",
                description:
                  "Pathways tailored for both academic and vocational aspirations.",
                icon: ArrowRight,
                color: "amber",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <CardContent className="p-6">
                  <div
                    className={`bg-${item.color}-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4`}
                  >
                    <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="font-sans text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 bg-white" id="impact">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Proven Results, Growing Ambitions
            </h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto mb-8"></div>
            <p className="font-sans text-xl text-gray-700">
              Launching from rural Indore, Vidyamrit drives deep school
              transformation where it's needed most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center bg-gradient-to-br from-amber-50 to-amber-100 p-8 rounded-2xl">
              <div className="text-4xl font-bold text-amber-600 mb-2">1</div>
              <div className="font-sans text-gray-700">
                School transformed in our first year
              </div>
            </div>
            <div className="text-center bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl">
              <div className="text-4xl font-bold text-red-600 mb-2">120+</div>
              <div className="font-sans text-gray-700">
                Students reached foundational literacy
              </div>
            </div>
            <div className="text-center bg-gradient-to-br from-amber-50 to-amber-100 p-8 rounded-2xl">
              <div className="text-4xl font-bold text-amber-600 mb-2">
                Zero to Reading
              </div>
              <div className="font-sans text-gray-700">
                Students progressed in just months
              </div>
            </div>
            <div className="text-center bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl">
              <div className="text-4xl font-bold text-red-600 mb-2">100</div>
              <div className="font-sans text-gray-700">
                Schools by 2027 (our ambition)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get Involved Section */}
      <section
        className="py-16 bg-gradient-to-b from-amber-50 to-white"
        id="get-involved"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Be the Catalyst
            </h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto mb-8"></div>
            <p className="font-sans text-xl text-gray-700">
              No matter how you choose to help—your support can change a child's
              destiny.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">
                  Volunteer
                </h3>
                <p className="font-sans text-gray-600 mb-6">
                  Teach Hindi, Maths, English, mentor students, or lead
                  enrichment sessions.
                </p>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  Start Volunteering
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">
                  Sponsor a School
                </h3>
                <p className="font-sans text-gray-600 mb-6">
                  Enable your organization to adopt and support a school's
                  journey.
                </p>
                <Button className="bg-red-500 hover:bg-red-600 text-white">
                  Become a Sponsor
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-4">
                  Partner With Us
                </h3>
                <p className="font-sans text-gray-600 mb-6">
                  NGOs, corporates, and institutions are invited to create
                  lasting impact together.
                </p>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  Explore Partnership
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Stories & Testimonials Section */}
      <section className="py-16 bg-white" id="stories">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              From Silence to Stories
            </h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto mb-8"></div>
            <p className="font-sans text-xl text-gray-700 max-w-3xl mx-auto">
              Real stories from students, parents, and volunteers who have been part of the Vidyamrit journey.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Testimonial 1 */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-white hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-20 h-20 rounded-full bg-amber-200 flex items-center justify-center mb-4 mx-auto">
                    {/* Placeholder for student image */}
                    <img
                      src="/testimonials/student-1.jpg"
                      alt="Student testimonial"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<span class="font-serif font-bold text-amber-700 text-2xl">R</span>';
                        }
                      }}
                    />
                  </div>
                  <Quote className="h-6 w-6 text-amber-500 mx-auto mb-3" />
                </div>
                <blockquote className="font-sans text-base text-gray-700 leading-relaxed mb-4 italic text-center">
                  "Before, I couldn't even read my own name. Now, I read books
                  and share stories with my little brother."
                </blockquote>
                <div className="text-center">
                  <div className="font-serif font-bold text-gray-900">Rani</div>
                  <div className="font-sans text-sm text-gray-600">Class 5 Student</div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-white hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-20 h-20 rounded-full bg-red-200 flex items-center justify-center mb-4 mx-auto">
                    {/* Placeholder for student image */}
                    <img
                      src="/testimonials/student-2.jpg"
                      alt="Student testimonial"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<span class="font-serif font-bold text-red-700 text-2xl">A</span>';
                        }
                      }}
                    />
                  </div>
                  <Quote className="h-6 w-6 text-red-500 mx-auto mb-3" />
                </div>
                <blockquote className="font-sans text-base text-gray-700 leading-relaxed mb-4 italic text-center">
                  "I used to be scared of numbers. Now I solve math problems confidently and help my friends too!"
                </blockquote>
                <div className="text-center">
                  <div className="font-serif font-bold text-gray-900">Arjun</div>
                  <div className="font-sans text-sm text-gray-600">Class 7 Student</div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-white hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-20 h-20 rounded-full bg-amber-200 flex items-center justify-center mb-4 mx-auto">
                    {/* Placeholder for parent image */}
                    <img
                      src="/testimonials/parent-1.jpg"
                      alt="Parent testimonial"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<span class="font-serif font-bold text-amber-700 text-2xl">P</span>';
                        }
                      }}
                    />
                  </div>
                  <Quote className="h-6 w-6 text-amber-500 mx-auto mb-3" />
                </div>
                <blockquote className="font-sans text-base text-gray-700 leading-relaxed mb-4 italic text-center">
                  "My daughter's confidence has grown so much. She now dreams of becoming a teacher and helping others."
                </blockquote>
                <div className="text-center">
                  <div className="font-serif font-bold text-gray-900">Priya's Mother</div>
                  <div className="font-sans text-sm text-gray-600">Parent</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Success Story Highlight */}
          <div className="max-w-4xl mx-auto mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-white">
              <CardContent className="p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    {/* Placeholder for success story image */}
                    <div className="w-full h-64 rounded-lg bg-gradient-to-br from-amber-100 to-red-100 flex items-center justify-center overflow-hidden">
                      <img
                        src="/success-stories/classroom-transformation.jpg"
                        alt="Classroom transformation"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="text-center text-gray-500"><BookOpen class="h-16 w-16 mx-auto mb-2" /><p class="text-sm">Success Story Image</p></div>';
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-gray-900 mb-4">
                      A Classroom Transformed
                    </h3>
                    <p className="font-sans text-gray-700 leading-relaxed mb-4">
                      In just six months, our first school saw remarkable changes. Students who couldn't read basic words are now reading storybooks. The classroom atmosphere shifted from silence to active participation, with children eager to learn and share.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div>
                        <div className="font-semibold text-gray-900">120+</div>
                        <div>Students Impacted</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">6 Months</div>
                        <div>Transformation Time</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* More Success Images Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { src: "/success-stories/students-learning.jpg", alt: "Students learning together" },
              { src: "/success-stories/digital-literacy.jpg", alt: "Digital literacy session" },
              { src: "/success-stories/volunteer-teaching.jpg", alt: "Volunteer teaching students" },
              { src: "/success-stories/graduation-ceremony.jpg", alt: "Graduation ceremony" },
            ].map((image, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-red-100 overflow-hidden hover:scale-105 transition-transform duration-300"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.className = "aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-red-100 flex items-center justify-center";
                      parent.innerHTML = `<div class="text-center text-gray-500"><Star class="h-8 w-8 mx-auto mb-1" /><p class="text-xs">${image.alt}</p></div>`;
                    }
                  }}
                />
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              className="border-amber-500 text-amber-700 hover:bg-amber-50 bg-transparent"
            >
              See More Stories
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-gradient-to-r from-amber-500 to-red-500 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
            Education Can't Wait
          </h2>
          <p className="font-sans text-xl mb-8 opacity-90">
            Every day counts. Let's ensure no child's dreams are left behind.
          </p>
          <Button
            size="lg"
            className="bg-white text-amber-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105"
          >
            Start Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
