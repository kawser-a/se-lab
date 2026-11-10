import { notFound } from "next/navigation";
import { getCoverLetter } from "@/actions/cover-letter";
import LetterEditor from "../_components/letter-editor";

export async function generateMetadata({ params }) {
    const { id } = await params;
    const found = await getCoverLetter(id);
    return { title: found ? `${found.letter.jobTitle} at ${found.letter.companyName} | GrowthGrid` : "Cover Letter | GrowthGrid" };
}

const CoverLetterPage = async ({ params }) => {
    const { id } = await params;
    const found = await getCoverLetter(id);
    if (!found) notFound();

    return <LetterEditor {...found} />;
};

export default CoverLetterPage;
