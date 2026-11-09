This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started
This project uses npm@10.9.2

1. First, install the necessary packages:

```
npm install
```

2. Generate Prisma Client

```bash
npx prisma generate
```

3. Create a `.env` file with your keys:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/growthgrid"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
GEMINI_API_KEY=""
# Optional. Defaults to gemini-3.8-flash.
GEMINI_MODEL=""
# Optional. Comma-separated models to try when the main one is busy.
GEMINI_FALLBACK_MODELS="gemini-3.5-flash-lite"
```

Then apply the database migrations:

```bash
npx prisma migrate deploy
```

4. Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```


Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tests

```bash
npm test
```

The tests render every CV template from a sample CV and check that the PDF text can be extracted.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
