import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Privacy Policy</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 max-w-3xl mx-auto animate-fade-in">
        <div className="space-y-6 text-sm text-foreground leading-relaxed">
          <div>
            <p className="text-muted-foreground mb-4">Last updated: February 13, 2026</p>
            <p>
              CareBag ("we", "our", or "us") is committed to protecting the privacy of your personal and health-related information. This Privacy Policy explains how we collect, use, store, and share your data when you use our platform.
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Information We Collect</h2>
            <p>We collect the following categories of information:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Account Information:</strong> Name, email address, and password when you register.</li>
              <li><strong className="text-foreground">Profile Data:</strong> Date of birth, gender, blood group, allergies, height, weight, and other health metrics you provide.</li>
              <li><strong className="text-foreground">Medical Documents:</strong> Health records, prescriptions, lab reports, and other documents you upload.</li>
              <li><strong className="text-foreground">Insurance Information:</strong> Insurer name, policy number, plan type, and expiry date.</li>
              <li><strong className="text-foreground">Usage Data:</strong> How you interact with CareBag, including pages visited and features used.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>Your information is used to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Provide and maintain the CareBag platform and its features.</li>
              <li>Store and organize your medical records securely.</li>
              <li>Enable sharing of records with healthcare partners and doctors with your explicit consent.</li>
              <li>Send you important notifications about your account and documents.</li>
              <li>Improve our platform and develop new features.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. Legal Basis for Processing (GDPR)</h2>
            <p>We process your personal data based on:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Consent:</strong> You provide explicit consent when creating your account and sharing data with partners.</li>
              <li><strong className="text-foreground">Contractual Necessity:</strong> Processing necessary to provide our services to you.</li>
              <li><strong className="text-foreground">Legitimate Interest:</strong> Improving our services and ensuring platform security.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Data Sharing</h2>
            <p>We do not sell your personal data. We may share your information with:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Healthcare Partners:</strong> Only with your explicit consent through our OTP-based consent flow.</li>
              <li><strong className="text-foreground">Doctors:</strong> Only when you or an authorized partner grants access.</li>
              <li><strong className="text-foreground">Service Providers:</strong> Infrastructure and hosting providers who process data on our behalf under strict agreements.</li>
              <li><strong className="text-foreground">Legal Requirements:</strong> When required by applicable law or regulation.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Data Security</h2>
            <p>We implement robust security measures including:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Encryption in transit (HTTPS/TLS) for all data transfers.</li>
              <li>Row-Level Security (RLS) policies ensuring data isolation between users.</li>
              <li>Signed URLs with time-limited access for document retrieval.</li>
              <li>Role-based access control with separate permission tiers.</li>
              <li>Audit logging of all administrative actions.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Your Rights</h2>
            <p>Under GDPR and India's DPDP Act, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Access:</strong> Request a copy of your personal data.</li>
              <li><strong className="text-foreground">Rectification:</strong> Correct inaccurate or incomplete data.</li>
              <li><strong className="text-foreground">Erasure:</strong> Request deletion of your account and all associated data.</li>
              <li><strong className="text-foreground">Portability:</strong> Receive your data in a portable format.</li>
              <li><strong className="text-foreground">Withdraw Consent:</strong> Withdraw consent for data processing at any time.</li>
              <li><strong className="text-foreground">Grievance Redressal:</strong> Contact our Grievance Officer for any complaints.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">7. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active. When you delete your account, all associated data (profiles, documents, and records) are permanently removed within 30 days. Audit logs may be retained for up to 12 months for legal compliance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">8. Children's Privacy</h2>
            <p>
              CareBag allows parents or guardians to manage health records on behalf of minors. Consent from a parent or guardian is required for users under 18 years of age.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">9. Grievance Officer (DPDP Act)</h2>
            <p>
              In accordance with India's Digital Personal Data Protection Act, 2023, you may contact our Grievance Officer for any concerns:
            </p>
            <div className="bg-muted/50 rounded-xl p-4 mt-2">
              <p className="font-medium text-foreground">Grievance Officer</p>
              <p className="text-muted-foreground">Email: privacy@carebag.in</p>
              <p className="text-muted-foreground">Response time: Within 72 hours</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or via email. Continued use of CareBag after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">11. Contact Us</h2>
            <p>
              For questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-muted/50 rounded-xl p-4 mt-2">
              <p className="font-medium text-foreground">CareBag Privacy Team</p>
              <p className="text-muted-foreground">Email: privacy@carebag.in</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
