import { NextRequest, NextResponse } from 'next/server';
import { db, assessmentInstances, assessmentPeriods, users, assessmentTemplates } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get assessment instances for the user
    const instances = await db
      .select({
        id: assessmentInstances.id,
        userId: assessmentInstances.userId,
        periodId: assessmentInstances.periodId,
        templateId: assessmentInstances.templateId,
        status: assessmentInstances.status,
        completedAt: assessmentInstances.completedAt,
        createdAt: assessmentInstances.createdAt,
        periodName: assessmentPeriods.name,
        periodStartDate: assessmentPeriods.startDate,
        periodEndDate: assessmentPeriods.endDate,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        templateName: assessmentTemplates.name,
        templateDescription: assessmentTemplates.description,
      })
      .from(assessmentInstances)
      .innerJoin(assessmentPeriods, eq(assessmentInstances.periodId, assessmentPeriods.id))
      .innerJoin(users, eq(assessmentInstances.userId, users.id))
      .innerJoin(assessmentTemplates, eq(assessmentInstances.templateId, assessmentTemplates.id))
      .where(eq(assessmentInstances.userId, userId));

    // Transform the data to match the frontend expectations
    const assessments = instances.map(instance => ({
      id: instance.id.toString(),
      title: instance.templateName || `Assessment #${instance.id}`,
      description: instance.templateDescription || `Assessment for ${instance.periodName} period`,
      status: instance.status as 'draft' | 'active' | 'completed' | 'archived',
      createdAt: instance.createdAt,
      updatedAt: instance.completedAt || instance.createdAt,
      assignedTo: instance.userEmail,
      dueDate: instance.periodEndDate,
      periodName: instance.periodName,
      templateId: instance.templateId,
    }));

    return NextResponse.json(assessments);
  } catch (error) {
    logger.error('Failed to fetch user assessments', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
} 