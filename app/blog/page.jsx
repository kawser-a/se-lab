import MainBlog from "@/components/MainBlog";

export const metadata = {
    title: "Blog | GrowthGrid",
    description: "Career advice for students and fresh graduates: applications, interviews and the first job.",
};

export default function BlogPage() {
    return (
        <div className="pb-24 [&>section]:mt-12">
            <MainBlog />
        </div>
    );
}
