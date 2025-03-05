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

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: [
        "By accessing or using PokéShelf (the \"Service\"), you agree to these Terms of Service (\"Terms\"). If you do not agree with these Terms, please do not use our Service."
      ]
    },
    {
      title: "2. Use of the Service",
      subsections: [
        {
          title: "Eligibility:",
          content: "You must be at least 13 years old to use our Service. Users under 18 must have parental or guardian consent."
        },
        {
          title: "Account Responsibility:",
          content: "You are responsible for maintaining the security of your account and for all activities under your account."
        },
        {
          title: "Prohibited Conduct:",
          content: "You agree not to use our Service to:",
          bullets: [
            "Violate any applicable laws or regulations.",
            "Infringe on the rights of others.",
            "Transmit harmful or malicious content.",
            "Engage in fraudulent or deceptive practices."
          ]
        }
      ]
    },
    {
      title: "3. User-Generated Content",
      content: [
        "Any content you submit remains your property, but by submitting, you grant us a worldwide, non-exclusive license to use, modify, and display that content as necessary for providing the Service."
      ]
    },
    {
      title: "4. Intellectual Property",
      content: [
        "All content provided on PokéShelf, including text, images, and graphics, is the property of PokéShelf or its licensors. You may not use any of our content without express written permission."
      ]
    },
    {
      title: "5. Disclaimers and Limitation of Liability",
      subsections: [
        {
          title: "Disclaimer of Warranties:",
          content: "The Service is provided \"as is\" and \"as available\" without any warranties, express or implied."
        },
        {
          title: "Limitation of Liability:",
          content: "Under no circumstances will PokéShelf be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service."
        }
      ]
    },
    {
      title: "6. No Affiliation with The Pokémon Company",
      content: [
        "PokéShelf is an independent website. We are not affiliated with, endorsed, or sponsored by The Pokémon Company or any related entities. All trademarks and intellectual property related to Pokémon belong to The Pokémon Company."
      ]
    },
    {
      title: "7. Third-Party Services",
      content: [
        "Our Service relies on third-party providers including Clerk (authentication), MongoDB (data storage), and Vercel (hosting). Your use of these services is subject to their respective terms and privacy policies."
      ]
    },
    {
      title: "8. Changes to the Terms",
      content: [
        "We reserve the right to modify these Terms at any time. Your continued use of the Service constitutes acceptance of any changes."
      ]
    },
    {
      title: "9. Termination",
      content: [
        "We may suspend or terminate your access to the Service at our discretion, without notice, for conduct that violates these Terms."
      ]
    },
    {
      title: "10. Governing Law",
      content: [
        "These Terms shall be governed by and construed in accordance with the laws of the State of Connecticut, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the appropriate courts located in Connecticut."
      ]
    },
    {
      title: "11. Contact Us",
      content: [
        "For any questions regarding these Terms, please contact us at:",
        "Email: dryfoosa@gmail.com"
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0">
      <div className="mb-6">
        <Link 
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
      </div>
      
      <div className="bg-card rounded-xl border border-border/40 p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold mb-2 md:mb-0">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {currentDate}</p>
        </div>
        
        <Separator className="my-6" />
        
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="space-y-8">
            {sections.map((section, idx) => (
              <section key={idx} className="space-y-3">
                <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
                
                {section.content && section.content.map((paragraph, i) => (
                  <p key={i} className="text-foreground/90">
                    {paragraph}
                  </p>
                ))}
                
                {section.subsections && (
                  <div className="space-y-4 mt-2">
                    {section.subsections.map((subsection, i) => (
                      <div key={i} className="ml-4 bg-muted/30 p-4 rounded-lg border border-border/30">
                        <h3 className="font-medium mb-2">{subsection.title}</h3>
                        <p className="text-foreground/80">{subsection.content}</p>
                        
                        {subsection.bullets && (
                          <ul className="list-disc pl-5 space-y-1 mt-2">
                            {subsection.bullets.map((bullet, j) => (
                              <li key={j} className="text-muted-foreground">{bullet}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}