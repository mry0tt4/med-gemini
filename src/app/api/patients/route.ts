import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// GET /api/patients - Get all patients (supports ?search=query)
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check for search query
        const searchParams = req.nextUrl.searchParams;
        const searchQuery = searchParams.get("search");

        const patients = await prisma.patient.findMany({
            where: searchQuery
                ? {
                    OR: [
                        { name: { contains: searchQuery, mode: "insensitive" } },
                        { email: { contains: searchQuery, mode: "insensitive" } },
                        { phone: { contains: searchQuery, mode: "insensitive" } },
                    ],
                }
                : undefined,
            include: {
                encounters: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            orderBy: { createdAt: "desc" },
            take: searchQuery ? 10 : undefined, // Limit results for search
        });

        // Format response with age calculation for search results
        const formattedPatients = patients.map((patient: typeof patients[number]) => ({
            ...patient,
            age: calculateAge(patient.dateOfBirth),
        }));

        return NextResponse.json(formattedPatients);
    } catch (error) {
        console.error("Error fetching patients:", error);
        return NextResponse.json(
            { error: "Failed to fetch patients" },
            { status: 500 }
        );
    }
}

// Helper to calculate age
function calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// POST /api/patients - Create a new patient
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, dateOfBirth, gender, symptoms } = body;

        // Validate required fields
        if (!name || !dateOfBirth || !gender) {
            return NextResponse.json(
                { error: "Name, date of birth, and gender are required" },
                { status: 400 }
            );
        }

        // Create patient
        const patient = await prisma.patient.create({
            data: {
                name,
                dateOfBirth: new Date(dateOfBirth),
                gender,
            },
        });

        // If symptoms provided, create an initial encounter
        if (symptoms) {
            await prisma.encounter.create({
                data: {
                    patientId: patient.id,
                    symptoms,
                },
            });
        }

        return NextResponse.json(patient, { status: 201 });
    } catch (error) {
        console.error("Error creating patient:", error);
        return NextResponse.json(
            { error: "Failed to create patient" },
            { status: 500 }
        );
    }
}
