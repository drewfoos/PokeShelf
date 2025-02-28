import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-6">
        <Link 
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground mb-6">Last updated: {currentDate}</p>
      
      <Separator className="my-6" />
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p>
            Welcome to PokéShelf ("we", "us", "our"). We are committed to protecting your personal information 
            and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your 
            information when you visit our website (https://www.pokeshelf.com/) and use our services.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
          <p>When you use our service, we collect the following information:</p>
          
          <div className="mt-3 space-y-3">
            <div>
              <h3 className="font-medium">User Identification:</h3>
              <ul className="list-disc ml-6">
                <li>clerkId: A unique identifier provided by our authentication provider.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium">Contact Information:</h3>
              <ul className="list-disc ml-6">
                <li>Email Address: The email you use for signing up or logging in.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium">Profile Information:</h3>
              <ul className="list-disc ml-6">
                <li>Name: Your display name (e.g., "Andrew Dryfoos").</li>
                <li>Image URL: A link to your profile picture (if provided).</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium">Metadata:</h3>
              <ul className="list-disc ml-6">
                <li>createdAt: Timestamp when your account was created.</li>
                <li>updatedAt: Timestamp when your account was last updated.</li>
              </ul>
            </div>
          </div>
          
          <p className="mt-3">
            We may also collect additional information automatically (e.g., IP addresses, browser type, 
            and usage data) to help us improve our service.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
          <p>We use your personal data to:</p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li>Provide and maintain our service.</li>
            <li>Personalize your experience.</li>
            <li>Communicate with you about updates, promotions, or important notices.</li>
            <li>Analyze usage and improve our website.</li>
            <li>Comply with legal obligations.</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">4. How We Share Your Information</h2>
          <p>
            We do not sell your personal data. We may share your information with:
          </p>
          <ul className="list-disc ml-6 space-y-2 mt-2">
            <li>
              <strong>Service Providers:</strong> Trusted third parties who help us operate our website 
              (e.g., Clerk for authentication, MongoDB for data storage, and Vercel for hosting).
            </li>
            <li>
              <strong>Legal Authorities:</strong> When required by law or to protect our rights.
            </li>
            <li>
              <strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale, 
              your information may be transferred as part of the transaction.
            </li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
          <p>
            We implement technical and organizational measures to secure your data from unauthorized access 
            or disclosure. However, no method of transmission over the Internet is completely secure.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
          <p>
            We retain your personal data only as long as necessary to fulfill the purposes outlined in this 
            Privacy Policy, unless a longer retention period is required by law.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
          <p>
            Depending on your location, you may have rights regarding your personal data, such as accessing, 
            updating, or deleting your information. To exercise these rights, please contact us at{' '}
            <a href="mailto:contact@pokeshelf.com" className="text-primary hover:underline">contact@pokeshelf.com</a>.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">8. Third-Party Services</h2>
          <p>
            Our website uses several third-party services:
          </p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li>Clerk: For user authentication.</li>
            <li>MongoDB: For data storage.</li>
            <li>Vercel: For hosting our website.</li>
          </ul>
          <p className="mt-2">
            Each of these providers has its own privacy policy. We encourage you to review their policies to 
            understand how they handle your data.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">9. No Affiliation with The Pokémon Company</h2>
          <p>
            PokéShelf is an independent website and is not affiliated with, endorsed, or sponsored by 
            The Pokémon Company or any of its subsidiaries.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">10. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page along 
            with an updated effective date. We encourage you to review this policy periodically.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="mt-2">
            Email: <a href="mailto:contact@pokeshelf.com" className="text-primary hover:underline">contact@pokeshelf.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}