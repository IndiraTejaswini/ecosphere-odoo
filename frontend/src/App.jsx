import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 1. Import your components
import Navbar from './Components/Home/Navbar';
import HeroSection from './Components/Home/HeroSection'; 
import FeatureSection from './Components/Home/FeatureSection'; 
import AboutUs from './Components/Home/AboutUs'; 
import Faq from './Components/Home/Faq';
import Testimonals from './Components/Home/Testimonals';
import Footer from './Components/Home/Footer';





export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar sits at the top */}
      <Navbar /> 
      
      <Routes>
        {/* Wrap both sections in a Fragment (<>...</>) so they both show on the home page */}
        <Route 
          path="/" 
          element={
            <>
              <HeroSection />
              <FeatureSection />
              <AboutUs />
              <Testimonals/>
              
              <Faq />
              <Footer/>

              
             
               
            </>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}