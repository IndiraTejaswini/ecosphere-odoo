import React, { useState } from 'react';
import TextType from './TextType';

const cards = [
  {
    id: 1,
    title: "Sustainability First",
    desc: "We help organizations measure, manage, and improve their environmental impact by transforming operational data into actionable sustainability insights.",
    // Image: Wind turbines in a green field (Represents renewable energy and environmental impact)
    img: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=800&auto=format"
  },
  {
    id: 2,
    title: "Data-Driven ESG Intelligence",
    desc: "Our platform unifies environmental, social, and governance metrics into one intelligent dashboard, enabling informed and responsible business decisions.",
    // Image: A modern data analytics dashboard on a screen (Represents intelligent data and metrics)
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format"
  },
  {
    id: 3,
    title: "Empowering Employee Engagement",
    desc: "From CSR activities to sustainability challenges and rewards, we encourage every employee to actively contribute toward organizational ESG goals.",
    // Image: A team collaborating and smiling together at a workspace (Represents active employee engagement and team culture)
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format"
  },
  {
    id: 4,
    title: "Built for Modern Enterprises",
    desc: "EcoSphere streamlines governance, compliance, carbon accounting, reporting, and automation through a secure, scalable, and enterprise-ready platform.",
    // Image: Sleek, modern corporate architecture/glass building (Represents enterprise scale, security, and corporate foundation)
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format"
  }
];

export default function AboutUs() {
  const [activeId, setActiveId] = useState(1);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Animated About Us Heading */}
        <div className="text-center mb-12">
          <TextType 
            as="h2"
            text="ABOUT US"
            className="text-4xl font-bold text-slate-900"
            typingSpeed={80}
            startOnVisible={true}
          />
        </div>

        <div className="h-[450px] flex gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => setActiveId(card.id)}
              className={`relative rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-700 ease-in-out ${
                activeId === card.id ? "flex-[4]" : "flex-[1]"
              }`}
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: `url(${card.img})` }}
              />
              
              {/* Text Area with transparent background (Glassmorphism) */}
              <div className={`absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 transition-opacity duration-500 ${activeId === card.id ? "opacity-100" : "opacity-0"}`}>
                <div className="text-xl font-bold text-white mb-2 bg-black/30 w-10 h-10 flex items-center justify-center rounded-full mb-4">
                  {card.id}
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">{card.title}</h4>
                <p className="text-sm text-white/90 leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}