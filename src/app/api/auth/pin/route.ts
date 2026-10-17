import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_PIN = '1234';

export async function POST(req: NextRequest) {
  try {
    const { program, pin } = await req.json();

    if (!program || !pin) {
      return NextResponse.json({ error: 'Program and PIN are required' }, { status: 400 });
    }

    const settingKey =
      program === 'c'
        ? 'pincode_program_c'
        : program === 'b'
        ? 'pincode_program_b'
        : 'pincode_program_a';

    const setting = await prisma.appSetting.findUnique({
      where: { key: settingKey },
    });

    const validPin = setting?.value || DEFAULT_PIN;
    const isValid = String(pin).trim() === String(validPin).trim();

    return NextResponse.json({
      valid: isValid,
      program,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to verify PIN', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { program, currentPin, newPin } = await req.json();

    if (!program || !currentPin || !newPin) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const settingKey =
      program === 'c'
        ? 'pincode_program_c'
        : program === 'b'
        ? 'pincode_program_b'
        : 'pincode_program_a';

    const setting = await prisma.appSetting.findUnique({
      where: { key: settingKey },
    });

    const validPin = setting?.value || DEFAULT_PIN;
    if (String(currentPin).trim() !== String(validPin).trim()) {
      return NextResponse.json({ error: 'รหัส PIN ปัจจุบันไม่ถูกต้อง' }, { status: 401 });
    }

    if (String(newPin).trim().length < 4) {
      return NextResponse.json({ error: 'รหัส PIN ใหม่ต้องมีอย่างน้อย 4 หลัก' }, { status: 400 });
    }

    const label =
      program === 'c'
        ? 'PIN Code โปรแกรม C'
        : program === 'b'
        ? 'PIN Code โปรแกรม B'
        : 'PIN Code โปรแกรม A';

    await prisma.appSetting.upsert({
      where: { key: settingKey },
      update: { value: String(newPin).trim() },
      create: {
        key: settingKey,
        value: String(newPin).trim(),
        label,
        group: 'security',
      },
    });

    return NextResponse.json({ success: true, message: 'เปลี่ยนรหัส PIN เรียบร้อยแล้ว' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update PIN', details: error.message },
      { status: 500 }
    );
  }
}

