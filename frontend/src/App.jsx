import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 1. Import your components
import Navbar from './components/Home/Navbar';
import HeroSection from './components/Home/HeroSection'; 
import FeatureSection from './components/Home/FeatureSection'; 
import AboutUs from './components/Home/AboutUs'; 
import Faq from './components/Home/Faq';
import Testimonals from './components/Home/Testimonals';
import Footer from './components/Home/Footer';





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