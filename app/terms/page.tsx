import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function TermsPage() {
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
      
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-muted-foreground mb-6">Last updated: {currentDate}</p>
      
      <Separator className="my-6" />
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using PokéShelf (the "Service"), you agree to these Terms of Service ("Terms"). 
            If you do not agree with these Terms, please do not use our Service.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">2. Use of the Service</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Eligibility:</strong> You must be at least 13 years old to use our Service. 
              Users under 18 must have parental or guardian consent.
            </li>
            <li>
              <strong>Account Responsibility:</strong> You are responsible for maintaining the security 
              of your account and for all activities under your account.
            </li>
            <li>
              <strong>Prohibited Conduct:</strong> You agree not to use our Service to:
              <ul className="list-disc ml-6 mt-2">
                <li>Violate any applicable laws or regulations.</li>
                <li>Infringe on the rights of others.</li>
                <li>Transmit harmful or malicious content.</li>
                <li>Engage in fraudulent or deceptive practices.</li>
              </ul>
            </li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">3. User-Generated Content</h2>
          <p>
            Any content you submit remains your property, but by submitting, you grant us a worldwide, 
            non-exclusive license to use, modify, and display that content as necessary for providing the Service.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">4. Intellectual Property</h2>
          <p>
            All content provided on PokéShelf, including text, images, and graphics, is the property of 
            PokéShelf or its licensors. You may not use any of our content without express written permission.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">5. Disclaimers and Limitation of Liability</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Disclaimer of Warranties:</strong> The Service is provided "as is" and "as available" 
              without any warranties, express or implied.
            </li>
            <li>
              <strong>Limitation of Liability:</strong> Under no circumstances will PokéShelf be liable 
              for any indirect, incidental, special, or consequential damages arising from your use of the Service.
            </li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">6. No Affiliation with The Pokémon Company</h2>
          <p>
            PokéShelf is an independent website. We are not affiliated with, endorsed, or sponsored by 
            The Pokémon Company or any related entities. All trademarks and intellectual property related 
            to Pokémon belong to The Pokémon Company.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">7. Third-Party Services</h2>
          <p>
            Our Service relies on third-party providers including Clerk (authentication), MongoDB (data storage), 
            and Vercel (hosting). Your use of these services is subject to their respective terms and privacy policies.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">8. Changes to the Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Your continued use of the Service 
            constitutes acceptance of any changes.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at our discretion, without notice, 
            for conduct that violates these Terms.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of Connecticut, 
            without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved 
            in the appropriate courts located in Connecticut.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
          <p>
            For any questions regarding these Terms, please contact us at:
          </p>
          <p className="mt-2">
            Email: <a href="mailto:contact@pokeshelf.com" className="text-primary hover:underline">contact@pokeshelf.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}