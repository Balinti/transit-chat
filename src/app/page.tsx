import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Real-time transit updates
            <br />
            <span className="text-blue-600">from riders like you</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Get instant alerts about delays, crowding, and service changes.
            Report issues with one tap. Stay informed, arrive on time.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/app">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Try it now - No signup required
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">📢</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Official Updates
            </h3>
            <p className="text-gray-600">
              Get service alerts and advisories directly from transit operators.
              Never miss planned work or service changes.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Rider Signals
            </h3>
            <p className="text-gray-600">
              Real-time reports from fellow commuters. See crowding levels,
              delays, and issues before you reach the platform.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-3xl mb-4">🔔</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Alerts
            </h3>
            <p className="text-gray-600">
              Save your commute and get personalized notifications.
              Know about issues that affect your specific route.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Select Your Route</h3>
              <p className="text-gray-400 text-sm">
                Choose your line, direction, and stop
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">See Live Updates</h3>
              <p className="text-gray-400 text-sm">
                View real-time rider reports and official alerts
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Report Issues</h3>
              <p className="text-gray-400 text-sm">
                One-tap reporting for delays, crowding, and more
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Get Alerted</h3>
              <p className="text-gray-400 text-sm">
                Save your commute for personalized notifications
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Report Types */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          Report What Matters
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Quick, structured reports help other riders and transit operators
          respond faster to issues.
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 max-w-3xl mx-auto">
          {[
            { icon: '⏱️', label: 'Delays' },
            { icon: '👥', label: 'Crowding' },
            { icon: '🛗', label: 'Elevator Out' },
            { icon: '🚔', label: 'Police Activity' },
            { icon: '🔄', label: 'Platform Change' },
            { icon: '🚇', label: 'Vehicle Issue' },
            { icon: '⛔', label: 'Suspension' },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white p-4 rounded-lg border border-gray-200 text-center"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm text-gray-700">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start using TransitPulse today
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            No signup required to try. Create a free account to save your
            commute and get personalized alerts.
          </p>
          <Link href="/app">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Try it now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <span className="text-2xl">🚇</span>
              <span className="font-bold text-white">TransitPulse</span>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/pricing" className="hover:text-white">
                Pricing
              </Link>
              <Link href="/account" className="hover:text-white">
                Account
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            &copy; {new Date().getFullYear()} TransitPulse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
