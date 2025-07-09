import Image from 'next/image'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <header className="w-full py-8 flex flex-col items-center bg-white shadow-sm border-b border-gray-200">
        <Image src="/logo.svg" alt="Ovotime Logo" width={80} height={80} className="mb-4" />
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Welcome to Ovotime</h1>
        <p className="text-lg text-gray-700 max-w-2xl text-center">Ovotime is an open-source app designed to help scientists and bird enthusiasts predict the hatching dates of bird eggs&mdash;and to build a global, collaborative understanding of bird phenology.</p>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <section className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">Why Ovotime?</h2>
          <p className="mb-4 text-gray-800">We&apos;re still in active development, and your participation is key to making Ovotime better.</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Request species you&apos;d like to see included.</li>
            <li>Submit your observations&mdash;especially if you&apos;ve recorded hatching dates for nests we&apos;ve modeled.</li>
            <li>Contribute data to help improve our prediction models and expand our reach.</li>
          </ul>
          <p className="mb-4 text-gray-800">Your real-world observations are essential for refining our predictions and supporting ecological research. Every data point helps!</p>
          <p className="mb-4 text-gray-800">One of the key benefits of using Ovotime is that it can help reduce nest disturbance. By predicting key stages of the breeding cycle, researchers can time their visits more precisely, minimizing unnecessary interference and improving the welfare of nesting birds.</p>
        </section>
        <section className="max-w-2xl w-full bg-blue-50 rounded-xl shadow p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-900">🔭 Looking Ahead</h2>
          <p className="mb-4 text-gray-800">Ovotime is just getting started. Our long-term vision is to crowdsource phenological data for as many bird species and ecosystems as possible. We&apos;re also developing a hardware accessory that will:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Allow users to photograph eggs in a standardized way</li>
            <li>Automatically calculate egg shape and volume without direct measurements&mdash;minimizing handling</li>
            <li>Include color reference markers to enable accurate data collection of eggshell colour for various scientific interests and applications</li>
          </ul>
          <p className="mb-4 text-gray-800">These tools will make it easier to collect high-quality, non-invasive data in the field&mdash;especially for small or sensitive eggs&mdash;and open new avenues for behavioral, ecological, and chemical research.</p>
        </section>
        <Link href="/app">
          <button className="mt-4 px-8 py-3 bg-blue-700 text-white text-lg font-semibold rounded-lg shadow hover:bg-blue-800 transition">Go to Egg Prediction Tools</button>
        </Link>
      </main>
      <footer className="w-full py-6 bg-white border-t border-gray-200 text-center text-gray-500 text-sm">
        © 2025 Ovotime. Open-source bird phenology for everyone.
      </footer>
    </div>
  )
} 