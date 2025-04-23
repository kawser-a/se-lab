"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function updateUser(data) {
    const { userId } = await auth();
    if(!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId,
        },
    });

    if (!user) throw new Error("User not found");

    try {

        const result = await db.$transaction(async (tx) => {
            //find if industry exist
            let industryInsights = await tx.industryInsight.findUnique({
                where: {
                    industry: data.industry,
                },
            });


            //if industry doesn't exist, create it with default values
            if (!industryInsight) {
                industryInsight = await tx.industryInsight.create({
                    data: {
                        industry: data.industry,
                        salaryRanges: [],
                        growthRate: 0, //default value
                    }
                })
            }


            //update the user
        },
        {
            timeout: 10000,
        }
    );

    return result.user;

    } catch (error) {
        console.error("Error updating user and industry", error.message);
        throw new Error("Failed to update profile.");

    }
}
