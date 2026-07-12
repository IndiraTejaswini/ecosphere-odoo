// // import React, { useState } from "react";
// // import { motion } from "framer-motion";
// // import { Plus } from "lucide-react";
// // import TextType from './TextType'; // Import the typing animation

// // const faqs = [
// //   {
// //     question: "How does EcoSphere simplify ESG management?",
// //     answer: "EcoSphere brings environmental, social, and governance data into one platform, making it easier to track performance, monitor progress, and make informed decisions.",
// //   },
// //   {
// //     question: "Can EcoSphere automate ESG tracking?",
// //     answer: "Yes. It automatically calculates carbon emissions, tracks sustainability activities, and streamlines compliance workflows to reduce manual effort.",
// //   },
// //   {
// //     question: "How does EcoSphere engage employees?",
// //     answer: "Employees can join sustainability challenges, earn XP, unlock badges, redeem rewards, and contribute to company-wide ESG goals.",
// //   },
// //   {
// //     question: "Is EcoSphere suitable for growing organizations?",
// //     answer: "Absolutely. The platform scales with your business through secure governance tools, automated reporting, and enterprise-ready ESG management.",
// //   },
// // ];

// // export default function FAQ() {
// //   const [openIndex, setOpenIndex] = useState(null);

// //   return (
// //     <section className="pt-24 pb-16 bg-slate-50">
// //       <div className="max-w-4xl mx-auto px-6">
        
// //         {/* Animated FAQ Heading */}
// //         <div className="text-center mb-16">
// //           <TextType 
// //             as="h2"
// //             text="FREQUENTLY ASKED QUESTIONS"
// //             className="text-4xl font-extrabold text-[#0f2438]"
// //             typingSpeed={80}
// //             startOnVisible={true}
// //           />
// //         </div>

// //         <div className="space-y-6">
// //           {faqs.map((faq, i) => {
// //             const isOpen = openIndex === i;
// //             return (
// //               <div 
// //                 key={i} 
// //                 className="rounded-xl overflow-hidden bg-[#0f2438] shadow-lg transition-all duration-300"
// //               >
// //                 <button
// //                   onClick={() => setOpenIndex(isOpen ? null : i)}
// //                   className="w-full flex justify-between items-center px-8 py-6 text-left focus:outline-none"
// //                 >
// //                   <span className="text-lg font-bold text-white">
// //                     {faq.question}
// //                   </span>
                  
// //                   <div className={`transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
// //                     <Plus className="w-6 h-6 text-white" />
// //                   </div>
// //                 </button>

// //                 {/* Answer Area with Light Blue Background */}
// //                 <motion.div
// //                   initial={false}
// //                   animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
// //                   className="overflow-hidden bg-sky-50" // Light blue background for answer
// //                 >
// //                   <div className="px-8 pb-8 pt-2 text-black/95 leading-relaxed">
// //                     {faq.answer}
// //                   </div>
// //                 </motion.div>
// //               </div>
// //             );
// //           })}
// //         </div>
// //       </div>
// //     </section>
// //   );
// // }

// import React, { useState } from 'react';
// import TextType from './TextType';

// const cards = [
//   {
//     id: 1,
//     title: "Sustainability First",
//     desc: "We help organizations measure, manage, and improve their environmental impact by transforming operational data into actionable sustainability insights.",
//     img: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=800&auto=format"
//   },
//   {
//     id: 2,
//     title: "Data-Driven ESG Intelligence",
//     desc: "Our platform unifies environmental, social, and governance metrics into one intelligent dashboard, enabling informed and responsible business decisions.",
//     img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format"
//   },
//   {
//     id: 3,
//     title: "Empowering Employee Engagement",
//     desc: "From CSR activities to sustainability challenges and rewards, we encourage every employee to actively contribute toward organizational ESG goals.",
//     img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format"
//   }
// ];

// export default function AboutUs() {
//   const [activeId, setActiveId] = useState(1);

//   return (
//     <section id="about" className="py-24 bg-white px-[6vw]">
//       <div className="max-w-[1440px] mx-auto">
        
//         {/* Animated Heading */}
//         <div className="text-center mb-16">
//           <TextType 
//             as="h2"
//             text="ABOUT US"
//             className="text-4xl font-extrabold text-[#0f2438]"
//             typingSpeed={80}
//             startOnVisible={true}
//           />
//         </div>

//         <div className="h-[450px] flex gap-4">
//           {cards.map((card) => (
//             <div
//               key={card.id}
//               onClick={() => setActiveId(card.id)}
//               className={`relative rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-700 ease-in-out ${
//                 activeId === card.id ? "flex-[4]" : "flex-[1]"
//               }`}
//             >
//               {/* Background Image */}
//               <div 
//                 className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
//                 style={{ backgroundImage: `url(${card.img})` }}
//               />
              
//               {/* Text Area with transparent background (Glassmorphism) */}
//               <div className={`absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 transition-opacity duration-500 ${activeId === card.id ? "opacity-100" : "opacity-0"}`}>
//                 <div className="text-xl font-bold text-white mb-2 bg-black/30 w-10 h-10 flex items-center justify-center rounded-full mb-4">
//                   {card.id}
//                 </div>
//                 <h4 className="text-2xl font-bold text-white mb-2">{card.title}</h4>
//                 <p className="text-white/90 text-sm leading-relaxed max-w-xl">{card.desc}</p>
//               </div>
//             </div>
//           ))}
//         </div>

//       </div>
//     </section>
//   );
// }

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
    <section id="faqs" className="pt-24 pb-16 bg-slate-50">
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