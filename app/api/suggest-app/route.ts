import { NextRequest, NextResponse } from 'next/server';
import { saveAppSuggestion } from '@/lib/firestore';

/**
 * API route to save app suggestions to Firestore
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appName, appId } = body;

    if (!appName || typeof appName !== 'string' || appName.trim().length === 0) {
      return NextResponse.json(
        { error: 'App name is required' },
        { status: 400 }
      );
    }

    // Use provided appId or default to 'default'
    const appIdToUse = appId || 'default';

    // Save to Firestore
    await saveAppSuggestion(appName.trim(), appIdToUse);

    return NextResponse.json({ 
      success: true,
      message: 'Suggestion saved successfully'
    });
  } catch (error) {
    console.error('Error saving app suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to save suggestion' },
      { status: 500 }
    );
  }
}

