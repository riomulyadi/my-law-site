import { NextResponse } from 'next/server';
const Midtrans = require('midtrans-client');

const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

export async function POST(req: Request) {
  try {
    const { bookingId, amount, customerName, customerEmail } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount tidak valid' }, { status: 400 });
    }

    const parameter = {
      transaction_details: {
        order_id: `BOOKING-${bookingId}-${Date.now()}`,
        gross_amount: amount,
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail,
      },
      callbacks: {
        finish: `${req.headers.get('origin')}/dashboard`,
      },
    };

    const transaction = await snap.createTransaction(parameter);
    
    return NextResponse.json({ 
      token: transaction.token,
      redirect_url: transaction.redirect_url 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}