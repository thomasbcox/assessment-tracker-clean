import { NextRequest, NextResponse } from 'next/server';
import { AssessmentTemplatesService } from '@/lib/services/assessment-templates';
import { AssessmentQuestionsService } from '@/lib/services/assessment-questions';
import { AssessmentInstancesService } from '@/lib/services/assessment-instances';
import { InvitationsService } from '@/lib/services/invitations';
import { ServiceError } from '@/lib/types/service-interfaces';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateId = parseInt(id);
    
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const template = await AssessmentTemplatesService.getTemplateById(templateId.toString());
    
    if (!template) {
      return NextResponse.json(
        { error: 'Assessment template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateId = parseInt(id);
    
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const updatedTemplate = await AssessmentTemplatesService.updateTemplate(templateId.toString(), {
      name: body.name,
      version: body.version,
      description: body.description,
      assessmentTypeId: body.assessmentTypeId,
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateId = parseInt(id);
    
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    await AssessmentTemplatesService.deleteTemplate(templateId.toString());
    return NextResponse.json({ message: 'Assessment template deleted successfully' });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 