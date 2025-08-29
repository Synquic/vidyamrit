import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="font-serif text-2xl font-bold text-amber-400 mb-4">
              Vidyamrit
            </h3>
            <p className="font-sans text-gray-300 mb-6 leading-relaxed">
              Empowering India's underserved children with literacy, learning,
              and livelihood opportunities.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-amber-400 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-amber-400 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-amber-400 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-amber-400 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-bold text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#about"
                  className="font-sans text-gray-300 hover:text-amber-400 transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#approach"
                  className="font-sans text-gray-300 hover:text-amber-400 transition-colors"
                >
                  Our Approach
                </a>
              </li>
              <li>
                <a
                  href="#impact"
                  className="font-sans text-gray-300 hover:text-amber-400 transition-colors"
                >
                  Impact
                </a>
              </li>
              <li>
                <a
                  href="#stories"
                  className="font-sans text-gray-300 hover:text-amber-400 transition-colors"
                >
                  Success Stories
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="font-sans text-gray-300 hover:text-amber-400 transition-colors"
                >
                  Annual Reports
                </a>
              </li>
            </ul>
          </div>

          {/* Get Involved */}
          <div>
            <h4 className="font-serif text-lg font-bold text-white mb-4">
              Get Involved
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="font-sans text-gray-300 hover:text-amber-400 transition-colors"
                >
                  Volunteer
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="font-sans text-gray-300 hover:text-amber-400 transition-colors"
                >
                  Sponsor a School
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="font-sans text-gray-300 hover:text-amber-400 transition-colors"
                >
                  Corporate Partnership
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="font-sans text-gray-300 hover:text-amber-400 transition-colors"
                >
                  Donate
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="font-sans text-gray-300 hover:text-amber-400 transition-colors"
                >
                  Fundraise
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-serif text-lg font-bold text-white mb-4">
              Contact Us
            </h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-amber-400 mr-3 flex-shrink-0" />
                <span className="font-sans text-gray-300 text-sm">
                  Indore, Madhya Pradesh, India
                </span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-amber-400 mr-3 flex-shrink-0" />
                <a
                  href="mailto:hello@vidyamrit.org"
                  className="font-sans text-gray-300 text-sm hover:text-amber-400 transition-colors"
                >
                  hello@vidyamrit.org
                </a>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-amber-400 mr-3 flex-shrink-0" />
                <a
                  href="tel:+91-XXXXXXXXXX"
                  className="font-sans text-gray-300 text-sm hover:text-amber-400 transition-colors"
                >
                  +91-XXXXXXXXXX
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Heart className="h-4 w-4 text-red-500 mr-2" />
              <span className="font-sans text-gray-300 text-sm">
                Made with love for India's children by{" "}
                <a
                  href="https://synquic.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:underline"
                >
                  Synquic
                </a>
              </span>
            </div>
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <span className="font-sans text-gray-400 text-sm">
                © {new Date().getFullYear()} Vidyamrit. All rights reserved.
              </span>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="font-sans text-gray-400 text-sm hover:text-amber-400 transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="font-sans text-gray-400 text-sm hover:text-amber-400 transition-colors"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
