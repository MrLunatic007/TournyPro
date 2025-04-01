import Link from "next/link"
import { Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">TourneyPro</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium">
              Home
            </Link>
            <Link href="/tournaments" className="text-sm font-medium">
              Tournaments
            </Link>
            <Link href="/leaderboard" className="text-sm font-medium">
              Leaderboard
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">Last updated: April 1, 2025</p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
              <p>
                At TourneyPro ("we," "our," or "us"), we respect your privacy and are committed to protecting your
                personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you use our tournament management service.
              </p>
              <p>
                Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy,
                please do not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
              <p>We collect several types of information from and about users of our Service, including:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>
                  <strong>Personal Data:</strong> Name, email address, and password when you register for an account.
                </li>
                <li>
                  <strong>Tournament Data:</strong> Information about tournaments you create, including participant
                  names, match results, and tournament statistics.
                </li>
                <li>
                  <strong>Usage Data:</strong> Information about how you access and use our Service, including your IP
                  address, browser type, device information, pages visited, and time spent on the Service.
                </li>
                <li>
                  <strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to
                  track activity on our Service and hold certain information.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p>We use the information we collect for various purposes, including to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process and manage your account registration</li>
                <li>Fulfill your requests for tournament creation and management</li>
                <li>Send you technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our Service</li>
                <li>Detect, prevent, and address technical issues</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Disclosure of Your Information</h2>
              <p>We may disclose your personal information in the following situations:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>
                  <strong>To Service Providers:</strong> We may share your information with third-party vendors, service
                  providers, and other third parties who perform services on our behalf.
                </li>
                <li>
                  <strong>For Business Transfers:</strong> We may share or transfer your information in connection with,
                  or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a
                  portion of our business.
                </li>
                <li>
                  <strong>For Legal Purposes:</strong> We may disclose your information to comply with any court order,
                  law, or legal process, including to respond to any government or regulatory request.
                </li>
                <li>
                  <strong>With Your Consent:</strong> We may disclose your personal information for any other purpose
                  with your consent.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Data Security</h2>
              <p>
                We have implemented measures designed to secure your personal information from accidental loss and from
                unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on
                secure servers behind firewalls.
              </p>
              <p>
                Unfortunately, the transmission of information via the internet is not completely secure. Although we do
                our best to protect your personal information, we cannot guarantee the security of your personal
                information transmitted to our Service. Any transmission of personal information is at your own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Your Data Protection Rights</h2>
              <p>Depending on your location, you may have the following data protection rights:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>The right to access, update, or delete your personal information</li>
                <li>The right to rectification if your information is inaccurate or incomplete</li>
                <li>The right to object to our processing of your personal data</li>
                <li>The right to request restriction of processing your personal information</li>
                <li>The right to data portability</li>
                <li>The right to withdraw consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Children's Privacy</h2>
              <p>
                Our Service is not intended for children under the age of 13. We do not knowingly collect personal
                information from children under 13. If you are a parent or guardian and you are aware that your child
                has provided us with personal information, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
              </p>
              <p>
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy
                Policy are effective when they are posted on this page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at privacy@tourneypro.com.</p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">TourneyPro</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} TourneyPro. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

