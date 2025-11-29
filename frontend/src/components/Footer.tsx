function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Introduction */}
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center mb-4">
              <img 
                src="/fiskeatlogo.png" 
                alt="FiskEat Logo" 
                className="w-10 h-10 object-contain mr-3"
              />
              <h3 className="text-xl font-bold">FiskEat</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your smart dining companion at Fisk University. Making campus dining intelligent, accessible, and healthy.
            </p>
          </div>

          {/* Product Section */}
          <div>
            <h4 className="text-lg font-bold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="/menu" className="text-gray-400 hover:text-white transition-colors">
                  Live Menu
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Bulldog AI
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Nutrition Info
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Mobile App
                </a>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h4 className="text-lg font-bold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Get in Touch Section */}
          <div>
            <h4 className="text-lg font-bold mb-4">Get in Touch</h4>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-400">
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                ankitrijal432@gmail.com
              </li>
              <li className="flex items-center text-gray-400">
                <svg
                  className="w-5 h-5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                  />
                </svg>
                Open Source
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="mt-12 pt-8 border-t border-gray-800 dark:border-gray-700">
          <p className="text-center text-gray-400 text-sm">
            © 2025 FiskEat. Built with <span className="text-red-500">❤️</span> for Fisk
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

