import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Gunakan Service Role Key untuk bypass RLS
);

export async function POST(req: Request) {
  const data = await req.json();
  
  const { 
    order_id, 
    status_code, 
    gross_amount, 
    signature_key, 
    transaction_status, 
    fraud_status 
  } = data;

  // Verifikasi Signature Key untuk keamanan
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const hashed = crypto.createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex');

  if (hashed !== signature_key) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  // Ekstrak bookingId dari order_id (Format: BOOKING-id-timestamp)
  const orderIdParts = order_id.split('-');
  const bookingId = orderIdParts[1];

  if (transaction_status === 'capture' || transaction_status === 'settlement') {
    if (fraud_status === 'accept' || !fraud_status) {
      // Update database Supabase
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: 'Paid' })
        .eq('id', bookingId);

      if (error) console.error('Error updating status:', error);
    }
  }

  return NextResponse.json({ status: 'ok' });
}