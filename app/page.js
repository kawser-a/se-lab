import CompanyMarquee from "@/components/CompanyMarquee";
import FaqSection from "@/components/FaqSection";
import FeatureCarousel from "@/components/FeatureCarousel";
import HeroSection from "@/components/HeroSection";
import MainBlog from "@/components/MainBlog";
import Stats from "@/components/Stats";
import Team from "@/components/Team";
import Testimonial from "@/components/Testimonial";
import WorkFlow from "@/components/WorkFlow";

export default function Home() {
    return (
        <div>
            <HeroSection />
            <CompanyMarquee />
            <FeatureCarousel collapseDelay={4000} linePosition="left" ltr={false} />
            <Stats />
            <WorkFlow />
            <Testimonial />
            <Team />
            <FaqSection />
            <MainBlog />
        </div>
    );
}
