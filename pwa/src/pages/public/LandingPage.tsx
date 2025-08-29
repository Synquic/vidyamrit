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
                window.location.replace("/login");
              }}
            >
              Join the Movement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-amber-500 text-amber-700 hover:bg-amber-50 px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 bg-transparent"
            >
              Support a School
              <Heart className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
        {/* Scroll indicator at bottom center */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <a href="#about">
            <Scroll direction="down" msg="learn more" />
          </a>
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
                    280M+
                  </div>
                  <div className="text-sm text-gray-600">
                    Children in government schools
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    50%
                  </div>
                  <div className="text-sm text-gray-600">
                    Drop out before high school
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    70%
                  </div>
                  <div className="text-sm text-gray-600">
                    Cannot read at grade level
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    90%
                  </div>
                  <div className="text-sm text-gray-600">
                    Lack digital literacy
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

      {/* Stories Section */}
      <section className="py-16 bg-white" id="stories">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              From Silence to Stories
            </h2>
            <div className="w-24 h-1 bg-amber-500 mx-auto mb-8"></div>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-white">
              <CardContent className="p-8 md:p-12">
                <Quote className="h-12 w-12 text-amber-500 mb-6" />
                <blockquote className="font-sans text-xl md:text-2xl text-gray-700 leading-relaxed mb-6 italic">
                  "Before, I couldn't even read my own name. Now, I read books
                  and share stories with my little brother."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center mr-4">
                    <span className="font-serif font-bold text-amber-700">
                      R
                    </span>
                  </div>
                  <div>
                    <div className="font-serif font-bold text-gray-900">
                      Rani
                    </div>
                    <div className="font-sans text-gray-600">
                      Class 5 Student
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-8">
              <Button
                variant="outline"
                className="border-amber-500 text-amber-700 hover:bg-amber-50 bg-transparent"
              >
                See More Stories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
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
