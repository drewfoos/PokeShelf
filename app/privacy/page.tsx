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

  const sections = [
    {
      title: "1. Introduction",
      content: [
        "Welcome to PokéShelf (\"we\", \"us\", \"our\"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website (https://www.pokeshelf.com/) and use our services."
      ]
    },
    {
      title: "2. Information We Collect",
      content: [
        "When you use our service, we collect the following information:"
      ],
      subsections: [
        {
          title: "User Identification:",
          bullets: ["clerkId: A unique identifier provided by our authentication provider."]
        },
        {
          title: "Contact Information:",
          bullets: ["Email Address: The email you use for signing up or logging in."]
        },
        {
          title: "Profile Information:",
          bullets: [
            "Name: Your display name (e.g., \"John Doe\").",
            "Image URL: A link to your profile picture."
          ]
        },
        {
          title: "Metadata:",
          bullets: [
            "createdAt: Timestamp when your account was created.",
            "updatedAt: Timestamp when your account was last updated."
          ]
        }
      ],
      footer: "We may also collect additional information automatically (e.g., IP addresses, browser type, and usage data) to help us improve our service."
    },
    {
      title: "3. How We Use Your Information",
      content: [
        "We use your personal data to:"
      ],
      bullets: [
        "Provide and maintain our service.",
        "Personalize your experience.",
        "Communicate with you about updates, promotions, or important notices.",
        "Analyze usage and improve our website.",
        "Comply with legal obligations."
      ]
    },
    {
      title: "4. How We Share Your Information",
      content: [
        "We do not sell your personal data. We may share your information with:"
      ],
      bullets: [
        {
          title: "Service Providers:",
          description: "Trusted third parties who help us operate our website (e.g., Clerk for authentication, MongoDB for data storage, and Vercel for hosting)."
        },
        {
          title: "Legal Authorities:",
          description: "When required by law or to protect our rights."
        },
        {
          title: "Business Transfers:",
          description: "In the event of a merger, acquisition, or asset sale, your information may be transferred as part of the transaction."
        }
      ]
    },
    {
      title: "5. Data Security",
      content: [
        "We implement technical and organizational measures to secure your data from unauthorized access or disclosure. However, no method of transmission over the Internet is completely secure."
      ]
    },
    {
      title: "6. Data Retention",
      content: [
        "We retain your personal data only as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law."
      ]
    },
    {
      title: "7. Your Rights",
      content: [
        "Depending on your location, you may have rights regarding your personal data, such as accessing, updating, or deleting your information. To exercise these rights, please contact us at dryfoosa@gmail.com."
      ]
    },
    {
      title: "8. Third-Party Services",
      content: [
        "Our website uses several third-party services:"
      ],
      bullets: [
        "Clerk: For user authentication.",
        "MongoDB: For data storage.",
        "Vercel: For hosting our website."
      ],
      footer: "Each of these providers has its own privacy policy. We encourage you to review their policies to understand how they handle your data."
    },
    {
      title: "9. No Affiliation with The Pokémon Company",
      content: [
        "PokéShelf is an independent website and is not affiliated with, endorsed, or sponsored by The Pokémon Company or any of its subsidiaries."
      ]
    },
    {
      title: "10. Changes to This Privacy Policy",
      content: [
        "We may update this Privacy Policy from time to time. Changes will be posted on this page along with an updated effective date. We encourage you to review this policy periodically."
      ]
    },
    {
      title: "11. Contact Us",
      content: [
        "If you have any questions about this Privacy Policy, please contact us at:",
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
          <h1 className="text-3xl font-bold mb-2 md:mb-0">Privacy Policy</h1>
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
                  <div className="mt-4 space-y-4">
                    {section.subsections.map((subsection, i) => (
                      <div key={i} className="ml-4">
                        <h3 className="font-medium mb-2">{subsection.title}</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          {subsection.bullets.map((bullet, j) => (
                            <li key={j} className="text-muted-foreground">{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                
                {section.bullets && !section.subsections && (
                  <ul className="list-disc pl-5 space-y-2">
                    {section.bullets.map((bullet, i) => (
                      <li key={i} className="text-muted-foreground">
                        {typeof bullet === 'string' ? (
                          bullet
                        ) : (
                          <>
                            <strong>{bullet.title}</strong> {bullet.description}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                
                {section.footer && (
                  <p className="text-muted-foreground mt-3 text-sm">
                    {section.footer}
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}