import React from 'react';
import CircularGallery from './CircularGallery';

// Ensure you have these corresponding images in your src/assets/ folder
import image from '../../assets/image.png'; 
import feature1Img from '../../assets/feature1.jpg';
import feature2Img from '../../assets/feature2.jpg';
import feature3Img from '../../assets/feature3.jpg';
import feature4Img from '../../assets/feature4.jpg';
import feature5Img from '../../assets/feature5.jpg';
import feature6Img from '../../assets/feature6.jpg';
import feature7Img from '../../assets/feature7.jpg';

export default function FeatureSection() {
  const features = [
    {
      id: 1,
      title: "Carbon Tracking",
      description: "Track organizational carbon emissions with automated calculations, sustainability goals, and real-time environmental insights.",
      imageSrc: image,
      altText: "Code on a screen",
    },
    {
      id: 2,
      title: "ESG Dashboard",
      description: "Monitor Environmental, Social, and Governance performance through a unified dashboard with actionable analytics.",
      imageSrc: feature1Img,
      altText: "Checkmark and success",
    },
    {
      id: 3,
      title: "Gamification",
      description: "Boost participation using challenges, XP, badges, rewards, and leaderboards that motivate sustainable behavior.",
      imageSrc: feature3Img,
      altText: "Notification bell concept",
    },
    {
      id: 4,
      title: "Governance & Compliance",
      description: "Manage policies, audits, compliance issues, and governance workflows from one centralized platform.",
      imageSrc: feature4Img,
      altText: "Notification bell concept",
    },
    {
      id: 5,
      title: "Employee Engagement",
      description: "Encourage employees to participate in CSR initiatives, sustainability programs, and company-wide environmental efforts.",
      imageSrc: feature2Img,
      altText: "Notification bell concept",
    },
    {
      id: 6,
      title: "Smart Reporting",
      description: "Generate environmental, social, governance, and custom ESG reports with powerful filtering and export options.",
      imageSrc: feature5Img,
      altText: "Notification bell concept",
    },
    {
      id: 7,
      title: "Automated Carbon Accounting",
      description: "Automatically calculate emissions from business operations using configurable emission factors and operational data.",
      imageSrc: feature7Img,
      altText: "Notification bell concept",
    },
    {
      id: 8,
      title: "Real-Time Notifications",
      description: "Stay informed with instant alerts for approvals, compliance updates, badge unlocks, reminders, and key ESG events.",
      imageSrc: feature6Img,
      altText: "Notification bell concept",
    }
  ];

  // Map your features data to the format CircularGallery expects
  const galleryItems = features.map((feature) => ({
    image: feature.imageSrc,
    text: feature.title,
    description: feature.description // Passed to the WebGL Canvas
  }));

  return (
    <section className="py-20 bg-sky-50 px-[6vw]">
      <div className="max-w-[1440px] mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#0f2438] mb-4">
            Everything you need to build a sustainable enterprise.
          </h2>
          <p className="text-[#3c5468] max-w-2xl mx-auto text-lg">
            Measure carbon emissions, strengthen governance, engage employees, and achieve your ESG goals through one intelligent, unified platform.
          </p>
        </div>

        {/* Circular WebGL Gallery Wrapper */}
        <div className="w-full h-[600px] relative rounded-2xl overflow-hidden">
          <CircularGallery 
            items={galleryItems} 
            bend={3} 
            textColor="#ffffff" 
            borderRadius={0.05} 
          />
        </div>

      </div>
    </section>
  );
}