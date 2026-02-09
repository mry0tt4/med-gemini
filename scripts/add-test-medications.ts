import "dotenv/config";
import { prisma } from "../src/lib/db";

async function addMedications() {
    const patientId = 'd9403ef9-ef8b-41c7-a88e-01d6d69b97af';

    // Check if medications already exist
    const existing = await prisma.medication.count({ where: { patientId } });
    if (existing > 0) {
        console.log(`Patient already has ${existing} medications`);
        await prisma.$disconnect();
        return;
    }

    const medications = [
        { name: 'Metformin', dosage: '1000mg', frequency: 'twice daily', route: 'oral', status: 'active', reason: 'Type 2 Diabetes Mellitus', prescribedBy: 'Dr. Sarah Chen, Endocrinology', startDate: new Date('2015-04-01'), notes: 'Take with meals to reduce GI side effects' },
        { name: 'Lisinopril', dosage: '20mg', frequency: 'once daily', route: 'oral', status: 'active', reason: 'Hypertension', prescribedBy: 'Dr. Michael Park, Primary Care', startDate: new Date('2018-08-15'), notes: 'Monitor potassium levels' },
        { name: 'Atorvastatin', dosage: '40mg', frequency: 'once daily at bedtime', route: 'oral', status: 'active', reason: 'Hyperlipidemia', prescribedBy: 'Dr. Michael Park, Primary Care', startDate: new Date('2019-02-01'), notes: 'Take at night for best efficacy' },
        { name: 'Aspirin', dosage: '81mg', frequency: 'once daily', route: 'oral', status: 'active', reason: 'Cardiovascular protection', prescribedBy: 'Dr. Michael Park, Primary Care', startDate: new Date('2019-02-01'), notes: 'Low-dose aspirin for primary prevention' },
        { name: 'Vitamin D3', dosage: '2000 IU', frequency: 'once daily', route: 'oral', status: 'active', reason: 'Vitamin D deficiency', prescribedBy: 'Dr. Michael Park, Primary Care', startDate: new Date('2022-01-15'), notes: 'Last level: 28 ng/mL' }
    ];

    for (const med of medications) {
        await prisma.medication.create({ data: { patientId, ...med } });
        console.log('Added:', med.name);
    }

    console.log('✅ Added all medications');
    await prisma.$disconnect();
}

addMedications().catch(e => { console.error(e); process.exit(1); });
