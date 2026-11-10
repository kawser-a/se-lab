import { getCoverLetters } from "@/actions/cover-letter";
import CoverLetterList from "./_components/cover-letter-list";

export const metadata = {
    title: "Cover Letters | GrowthGrid",
};

const CoverLettersPage = async () => {
    const letters = await getCoverLetters();

    return (
        <div className="pt-4 pb-16">
            <h1 className="text-5xl md:text-6xl font-bold gradient-title text-[#F4F4F5]">
                Cover{" "}
                <span className="relative inline-block mb-6">
                    <span className="absolute inset-0 rotate-2 bg-[#9EFF00] -z-10 px-1" />
                    <strong className="text-black">Letters</strong>
                </span>
            </h1>
            <p className="text-muted-foreground mb-8 max-w-2xl">
                One for each job. Paste the advert, choose the CV to write from, then edit the draft until it sounds like you.
            </p>

            <CoverLetterList letters={letters} />
        </div>
    );
};

export default CoverLettersPage;
