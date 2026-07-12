import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import TextType from './TextType'; // Import the typing animation

const faqs = [
  {
    question: "How does EcoSphere simplify ESG management?",
    answer: "EcoSphere brings environmental, social, and governance data into one platform, making it easier to track performance, monitor progress, and make informed decisions.",
  },
  {
    question: "Can EcoSphere automate ESG tracking?",
    answer: "Yes. It automatically calculates carbon emissions, tracks sustainability activities, and streamlines compliance workflows to reduce manual effort.",
  },
  {
    question: "How does EcoSphere engage employees?",
    answer: "Employees can join sustainability challenges, earn XP, unlock badges, redeem rewards, and contribute to company-wide ESG goals.",
  },
  {
    question: "Is EcoSphere suitable for growing organizations?",
    answer: "Absolutely. The platform scales with your business through secure governance tools, automated reporting, and enterprise-ready ESG management.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="pt-24 pb-16 bg-slate-50">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Animated FAQ Heading */}
        <div className="text-center mb-16">
          <TextType 
            as="h2"
            text="FREQUENTLY ASKED QUESTIONS"
            className="text-4xl font-extrabold text-[#0f2438]"
            typingSpeed={80}
            startOnVisible={true}
          />
        </div>

        <div className="space-y-6">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div 
                key={i} 
                className="rounded-xl overflow-hidden bg-[#0f2438] shadow-lg transition-all duration-300"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex justify-between items-center px-8 py-6 text-left focus:outline-none"
                >
                  <span className="text-lg font-bold text-white">
                    {faq.question}
                  </span>
                  
                  <div className={`transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                </button>

                {/* Answer Area with Light Blue Background */}
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                  className="overflow-hidden bg-sky-50" // Light blue background for answer
                >
                  <div className="px-8 pb-8 pt-2 text-black/95 leading-relaxed">
                    {faq.answer}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}