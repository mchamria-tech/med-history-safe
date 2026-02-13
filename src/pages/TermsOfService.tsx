import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Terms of Service</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 max-w-3xl mx-auto animate-fade-in">
        <div className="space-y-6 text-sm text-foreground leading-relaxed">
          <div>
            <p className="text-muted-foreground mb-4">Last updated: February 13, 2026</p>
            <p>
              Welcome to CareBag. By creating an account or using our platform, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using CareBag, you confirm that you are at least 18 years old (or have parental/guardian consent), and agree to comply with these Terms and our Privacy Policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. Description of Service</h2>
            <p>CareBag provides a secure platform for:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Storing and organizing personal and family medical records.</li>
              <li>Managing multiple health profiles (self, family members, dependents).</li>
              <li>Sharing medical records with healthcare providers with explicit consent.</li>
              <li>Tracking insurance information and document metadata.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. User Accounts</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You agree to provide accurate, current, and complete information during registration.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
              <li>One person may create one account. Multiple accounts per person are not permitted.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Health Data Disclaimer</h2>
            <p>
              CareBag is a <strong>records management platform</strong>, not a medical service. We do not provide medical advice, diagnosis, or treatment. The accuracy and completeness of uploaded health records are your sole responsibility. Always consult qualified healthcare professionals for medical decisions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Data Ownership & Consent</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>You retain full ownership of all data and documents you upload to CareBag.</li>
              <li>You grant CareBag a limited license to store, process, and display your data solely for the purpose of providing the service.</li>
              <li>Sharing data with healthcare partners or doctors requires your explicit consent, which can be withdrawn at any time.</li>
              <li>You are responsible for ensuring you have the right to upload records on behalf of family members.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Acceptable Use</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Upload false, misleading, or fraudulent health records.</li>
              <li>Use CareBag for any illegal or unauthorized purpose.</li>
              <li>Attempt to access other users' data or accounts.</li>
              <li>Reverse engineer, decompile, or disassemble any part of the platform.</li>
              <li>Upload malicious files, viruses, or harmful content.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">7. Partner Organizations</h2>
            <p>
              Healthcare organizations ("Partners") may use CareBag to manage patient records with consent. Partners are bound by separate agreements and are responsible for complying with applicable healthcare data regulations (including HIPAA, DPDP Act, and GDPR where applicable).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">8. Account Termination</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>You may delete your account at any time through the app settings.</li>
              <li>Upon deletion, all your data (profiles, documents, records) will be permanently removed.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, CareBag shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform. Our total liability shall not exceed the amount you paid (if any) for using the service in the 12 months preceding the claim.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">10. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, India.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">11. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Material changes will be communicated through the app or via email. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">12. Contact</h2>
            <div className="bg-muted/50 rounded-xl p-4 mt-2">
              <p className="font-medium text-foreground">CareBag Legal</p>
              <p className="text-muted-foreground">Email: legal@carebag.in</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
